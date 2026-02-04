


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE SCHEMA IF NOT EXISTS "storage";


ALTER SCHEMA "storage" OWNER TO "supabase_admin";


CREATE TYPE "storage"."buckettype" AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE "storage"."buckettype" OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "public"."initialize_course_progress"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Create course progress record (no calculated fields)
  INSERT INTO course_progress (user_id, course_id)
  VALUES (NEW.user_id, NEW.course_id)
  ON CONFLICT (user_id, course_id) DO NOTHING;
  
  -- Create subject progress records (no calculated fields)
  INSERT INTO subject_progress (user_id, subject_id)
  SELECT NEW.user_id, s.id
  FROM subjects s
  WHERE s.course_id = NEW.course_id
  ON CONFLICT (user_id, subject_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_course_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_typeform_response"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  extracted_typeform_id UUID;
BEGIN
  -- Try to extract supabase_typeform_id from the response JSON
  IF NEW.response IS NOT NULL THEN
    -- Extract supabase_typeform_id from hidden fields in the response
    extracted_typeform_id := (NEW.response->>'supabase_typeform_id')::UUID;
    
    -- If we found a supabase_typeform_id, update the record and create progress entry
    IF extracted_typeform_id IS NOT NULL THEN
      -- Update the typeform_id column
      UPDATE "typeform-responses" 
      SET typeform_id = extracted_typeform_id 
      WHERE id = NEW.id;
      
      -- Create user_progress entry (avoid duplicates)
      INSERT INTO user_progress (user_id, typeform_id, completed_at)
      VALUES (NEW.user_id, extracted_typeform_id, NEW.created_at)
      ON CONFLICT (user_id, typeform_id) DO NOTHING;
      
      -- The rest of the progress tracking will be handled by existing triggers
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."process_typeform_response"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_activity_responses_to_progress"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Insert into user_progress for completed activities
    INSERT INTO public.user_progress (user_id, activity_id, completed_at)
    SELECT DISTINCT 
        ar.user_id,
        ar.activity_id,
        ar.created_at
    FROM public.activity_responses ar
    WHERE ar.user_id IS NOT NULL 
    AND ar.activity_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM public.user_progress up 
        WHERE up.user_id = ar.user_id 
        AND up.activity_id = ar.activity_id
    );
END;
$$;


ALTER FUNCTION "public"."sync_activity_responses_to_progress"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_progress_on_completion"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  subject_record RECORD;
  total_activities INTEGER;
BEGIN
  -- Get the activity details
  SELECT t.subject_id, t.order_index, s.course_id, s.order_index as subject_order_index
  INTO subject_record
  FROM typeforms t
  JOIN subjects s ON s.id = t.subject_id
  WHERE t.id = NEW.typeform_id;
  
  -- Get total activities in subject for status calculation
  SELECT COUNT(*) INTO total_activities
  FROM typeforms 
  WHERE subject_id = subject_record.subject_id;
  
  -- Update subject progress (only essential fields)
  UPDATE subject_progress 
  SET 
    completed_count = completed_count + 1,
    current_activity_index = GREATEST(current_activity_index, COALESCE(subject_record.order_index, 0)),
    last_activity_at = NEW.completed_at,
    status = CASE 
      WHEN (completed_count + 1) >= total_activities THEN 'completed'
      ELSE 'in_progress'
    END
  WHERE user_id = NEW.user_id AND subject_id = subject_record.subject_id;
  
  -- Update course progress (only essential fields)
  UPDATE course_progress 
  SET 
    current_subject_index = GREATEST(current_subject_index, COALESCE(subject_record.subject_order_index, 0)),
    last_activity_at = NEW.completed_at,
    status = CASE 
      WHEN (
        SELECT COUNT(*)
        FROM subject_progress sp
        JOIN subjects s ON s.id = sp.subject_id
        WHERE sp.user_id = NEW.user_id 
          AND s.course_id = subject_record.course_id 
          AND sp.status = 'completed'
      ) >= (
        SELECT COUNT(*)
        FROM subjects s
        WHERE s.course_id = subject_record.course_id
      ) THEN 'completed'
      ELSE 'in_progress'
    END
  WHERE user_id = NEW.user_id AND course_id = subject_record.course_id;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_progress_on_completion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_scorecards_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_scorecards_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION "storage"."add_prefixes"("_bucket_id" "text", "_name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION "storage"."can_insert_object"("bucketid" "text", "name" "text", "owner" "uuid", "metadata" "jsonb") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_leaf_prefixes"("bucket_ids" "text"[], "names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_rows_deleted integer;
BEGIN
    LOOP
        WITH candidates AS (
            SELECT DISTINCT
                t.bucket_id,
                unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        ),
        uniq AS (
             SELECT
                 bucket_id,
                 name,
                 storage.get_level(name) AS level
             FROM candidates
             WHERE name <> ''
             GROUP BY bucket_id, name
        ),
        leaf AS (
             SELECT
                 p.bucket_id,
                 p.name,
                 p.level
             FROM storage.prefixes AS p
                  JOIN uniq AS u
                       ON u.bucket_id = p.bucket_id
                           AND u.name = p.name
                           AND u.level = p.level
             WHERE NOT EXISTS (
                 SELECT 1
                 FROM storage.objects AS o
                 WHERE o.bucket_id = p.bucket_id
                   AND o.level = p.level + 1
                   AND o.name COLLATE "C" LIKE p.name || '/%'
             )
             AND NOT EXISTS (
                 SELECT 1
                 FROM storage.prefixes AS c
                 WHERE c.bucket_id = p.bucket_id
                   AND c.level = p.level + 1
                   AND c.name COLLATE "C" LIKE p.name || '/%'
             )
        )
        DELETE
        FROM storage.prefixes AS p
            USING leaf AS l
        WHERE p.bucket_id = l.bucket_id
          AND p.name = l.name
          AND p.level = l.level;

        GET DIAGNOSTICS v_rows_deleted = ROW_COUNT;
        EXIT WHEN v_rows_deleted = 0;
    END LOOP;
END;
$$;


ALTER FUNCTION "storage"."delete_leaf_prefixes"("bucket_ids" "text"[], "names" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION "storage"."delete_prefix"("_bucket_id" "text", "_name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."delete_prefix_hierarchy_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION "storage"."delete_prefix_hierarchy_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."enforce_bucket_name_length"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION "storage"."enforce_bucket_name_length"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."extension"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION "storage"."extension"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."filename"("name" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION "storage"."filename"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."foldername"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION "storage"."foldername"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_level"("name" "text") RETURNS integer
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION "storage"."get_level"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_prefix"("name" "text") RETURNS "text"
    LANGUAGE "sql" IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION "storage"."get_prefix"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_prefixes"("name" "text") RETURNS "text"[]
    LANGUAGE "plpgsql" IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION "storage"."get_prefixes"("name" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."get_size_by_bucket"() RETURNS TABLE("size" bigint, "bucket_id" "text")
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION "storage"."get_size_by_bucket"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "next_key_token" "text" DEFAULT ''::"text", "next_upload_token" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "id" "text", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION "storage"."list_multipart_uploads_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "next_key_token" "text", "next_upload_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer DEFAULT 100, "start_after" "text" DEFAULT ''::"text", "next_token" "text" DEFAULT ''::"text") RETURNS TABLE("name" "text", "id" "uuid", "metadata" "jsonb", "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql"
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION "storage"."list_objects_with_delimiter"("bucket_id" "text", "prefix_param" "text", "delimiter_param" "text", "max_keys" integer, "start_after" "text", "next_token" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."lock_top_prefixes"("bucket_ids" "text"[], "names" "text"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket text;
    v_top text;
BEGIN
    FOR v_bucket, v_top IN
        SELECT DISTINCT t.bucket_id,
            split_part(t.name, '/', 1) AS top
        FROM unnest(bucket_ids, names) AS t(bucket_id, name)
        WHERE t.name <> ''
        ORDER BY 1, 2
        LOOP
            PERFORM pg_advisory_xact_lock(hashtextextended(v_bucket || '/' || v_top, 0));
        END LOOP;
END;
$$;


ALTER FUNCTION "storage"."lock_top_prefixes"("bucket_ids" "text"[], "names" "text"[]) OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_delete_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."objects_delete_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_insert_prefix_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_insert_prefix_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    -- NEW - OLD (destinations to create prefixes for)
    v_add_bucket_ids text[];
    v_add_names      text[];

    -- OLD - NEW (sources to prune)
    v_src_bucket_ids text[];
    v_src_names      text[];
BEGIN
    IF TG_OP <> 'UPDATE' THEN
        RETURN NULL;
    END IF;

    -- 1) Compute NEW−OLD (added paths) and OLD−NEW (moved-away paths)
    WITH added AS (
        SELECT n.bucket_id, n.name
        FROM new_rows n
        WHERE n.name <> '' AND position('/' in n.name) > 0
        EXCEPT
        SELECT o.bucket_id, o.name FROM old_rows o WHERE o.name <> ''
    ),
    moved AS (
         SELECT o.bucket_id, o.name
         FROM old_rows o
         WHERE o.name <> ''
         EXCEPT
         SELECT n.bucket_id, n.name FROM new_rows n WHERE n.name <> ''
    )
    SELECT
        -- arrays for ADDED (dest) in stable order
        COALESCE( (SELECT array_agg(a.bucket_id ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        COALESCE( (SELECT array_agg(a.name      ORDER BY a.bucket_id, a.name) FROM added a), '{}' ),
        -- arrays for MOVED (src) in stable order
        COALESCE( (SELECT array_agg(m.bucket_id ORDER BY m.bucket_id, m.name) FROM moved m), '{}' ),
        COALESCE( (SELECT array_agg(m.name      ORDER BY m.bucket_id, m.name) FROM moved m), '{}' )
    INTO v_add_bucket_ids, v_add_names, v_src_bucket_ids, v_src_names;

    -- Nothing to do?
    IF (array_length(v_add_bucket_ids, 1) IS NULL) AND (array_length(v_src_bucket_ids, 1) IS NULL) THEN
        RETURN NULL;
    END IF;

    -- 2) Take per-(bucket, top) locks: ALL prefixes in consistent global order to prevent deadlocks
    DECLARE
        v_all_bucket_ids text[];
        v_all_names text[];
    BEGIN
        -- Combine source and destination arrays for consistent lock ordering
        v_all_bucket_ids := COALESCE(v_src_bucket_ids, '{}') || COALESCE(v_add_bucket_ids, '{}');
        v_all_names := COALESCE(v_src_names, '{}') || COALESCE(v_add_names, '{}');

        -- Single lock call ensures consistent global ordering across all transactions
        IF array_length(v_all_bucket_ids, 1) IS NOT NULL THEN
            PERFORM storage.lock_top_prefixes(v_all_bucket_ids, v_all_names);
        END IF;
    END;

    -- 3) Create destination prefixes (NEW−OLD) BEFORE pruning sources
    IF array_length(v_add_bucket_ids, 1) IS NOT NULL THEN
        WITH candidates AS (
            SELECT DISTINCT t.bucket_id, unnest(storage.get_prefixes(t.name)) AS name
            FROM unnest(v_add_bucket_ids, v_add_names) AS t(bucket_id, name)
            WHERE name <> ''
        )
        INSERT INTO storage.prefixes (bucket_id, name)
        SELECT c.bucket_id, c.name
        FROM candidates c
        ON CONFLICT DO NOTHING;
    END IF;

    -- 4) Prune source prefixes bottom-up for OLD−NEW
    IF array_length(v_src_bucket_ids, 1) IS NOT NULL THEN
        -- re-entrancy guard so DELETE on prefixes won't recurse
        IF current_setting('storage.gc.prefixes', true) <> '1' THEN
            PERFORM set_config('storage.gc.prefixes', '1', true);
        END IF;

        PERFORM storage.delete_leaf_prefixes(v_src_bucket_ids, v_src_names);
    END IF;

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."objects_update_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_level_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Set the new level
        NEW."level" := "storage"."get_level"(NEW."name");
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_update_level_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."objects_update_prefix_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."objects_update_prefix_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."operation"() RETURNS "text"
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION "storage"."operation"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."prefixes_delete_cleanup"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_bucket_ids text[];
    v_names      text[];
BEGIN
    IF current_setting('storage.gc.prefixes', true) = '1' THEN
        RETURN NULL;
    END IF;

    PERFORM set_config('storage.gc.prefixes', '1', true);

    SELECT COALESCE(array_agg(d.bucket_id), '{}'),
           COALESCE(array_agg(d.name), '{}')
    INTO v_bucket_ids, v_names
    FROM deleted AS d
    WHERE d.name <> '';

    PERFORM storage.lock_top_prefixes(v_bucket_ids, v_names);
    PERFORM storage.delete_leaf_prefixes(v_bucket_ids, v_names);

    RETURN NULL;
END;
$$;


ALTER FUNCTION "storage"."prefixes_delete_cleanup"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."prefixes_insert_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION "storage"."prefixes_insert_trigger"() OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql"
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION "storage"."search"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search_legacy_v1"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "offsets" integer DEFAULT 0, "search" "text" DEFAULT ''::"text", "sortcolumn" "text" DEFAULT 'name'::"text", "sortorder" "text" DEFAULT 'asc'::"text") RETURNS TABLE("name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION "storage"."search_v1_optimised"("prefix" "text", "bucketname" "text", "limits" integer, "levels" integer, "offsets" integer, "search" "text", "sortcolumn" "text", "sortorder" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer DEFAULT 100, "levels" integer DEFAULT 1, "start_after" "text" DEFAULT ''::"text", "sort_order" "text" DEFAULT 'asc'::"text", "sort_column" "text" DEFAULT 'name'::"text", "sort_column_after" "text" DEFAULT ''::"text") RETURNS TABLE("key" "text", "name" "text", "id" "uuid", "updated_at" timestamp with time zone, "created_at" timestamp with time zone, "last_accessed_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" STABLE
    AS $_$
DECLARE
    sort_col text;
    sort_ord text;
    cursor_op text;
    cursor_expr text;
    sort_expr text;
BEGIN
    -- Validate sort_order
    sort_ord := lower(sort_order);
    IF sort_ord NOT IN ('asc', 'desc') THEN
        sort_ord := 'asc';
    END IF;

    -- Determine cursor comparison operator
    IF sort_ord = 'asc' THEN
        cursor_op := '>';
    ELSE
        cursor_op := '<';
    END IF;
    
    sort_col := lower(sort_column);
    -- Validate sort column  
    IF sort_col IN ('updated_at', 'created_at') THEN
        cursor_expr := format(
            '($5 = '''' OR ROW(date_trunc(''milliseconds'', %I), name COLLATE "C") %s ROW(COALESCE(NULLIF($6, '''')::timestamptz, ''epoch''::timestamptz), $5))',
            sort_col, cursor_op
        );
        sort_expr := format(
            'COALESCE(date_trunc(''milliseconds'', %I), ''epoch''::timestamptz) %s, name COLLATE "C" %s',
            sort_col, sort_ord, sort_ord
        );
    ELSE
        cursor_expr := format('($5 = '''' OR name COLLATE "C" %s $5)', cursor_op);
        sort_expr := format('name COLLATE "C" %s', sort_ord);
    END IF;

    RETURN QUERY EXECUTE format(
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    NULL::uuid AS id,
                    updated_at,
                    created_at,
                    NULL::timestamptz AS last_accessed_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
            UNION ALL
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name,
                    id,
                    updated_at,
                    created_at,
                    last_accessed_at,
                    metadata
                FROM storage.objects
                WHERE name COLLATE "C" LIKE $1 || '%%'
                    AND bucket_id = $2
                    AND level = $4
                    AND %s
                ORDER BY %s
                LIMIT $3
            )
        ) obj
        ORDER BY %s
        LIMIT $3
        $sql$,
        cursor_expr,    -- prefixes WHERE
        sort_expr,      -- prefixes ORDER BY
        cursor_expr,    -- objects WHERE
        sort_expr,      -- objects ORDER BY
        sort_expr       -- final ORDER BY
    )
    USING prefix, bucket_name, limits, levels, start_after, sort_column_after;
END;
$_$;


ALTER FUNCTION "storage"."search_v2"("prefix" "text", "bucket_name" "text", "limits" integer, "levels" integer, "start_after" "text", "sort_order" "text", "sort_column" "text", "sort_column_after" "text") OWNER TO "supabase_storage_admin";


CREATE OR REPLACE FUNCTION "storage"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION "storage"."update_updated_at_column"() OWNER TO "supabase_storage_admin";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "internal_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "embed_id" "text",
    "short_description" "text",
    "is_quiz" boolean DEFAULT false NOT NULL,
    "category" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "hint" boolean,
    "module_id" "uuid",
    "order_index" integer DEFAULT 0,
    "form_id" "text",
    "activity_type" "text" DEFAULT 'typeform'::"text",
    "config" "jsonb",
    "topic_id" "uuid",
    "loop_type" "text",
    "difficulty" "text" DEFAULT 'fundamentals'::"text",
    "content" "text",
    "pass_video_url" "text",
    "fail_video_url" "text",
    "roleplay_config" "jsonb",
    "activity_image_url" "text",
    "avatar_image_url" "text",
    "avatar_name" "text",
    "character_id" "uuid",
    "agent_id" "text",
    "published" boolean DEFAULT true,
    "rubric_prompt" "text"
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


COMMENT ON COLUMN "public"."activities"."loop_type" IS 'introduce | practice | assess | coming soon';



COMMENT ON COLUMN "public"."activities"."difficulty" IS 'fundamentals | intermediate | advanced';



COMMENT ON COLUMN "public"."activities"."content" IS 'Full learning content: Monica setup, questions, answers, feedback as natural language';



COMMENT ON COLUMN "public"."activities"."roleplay_config" IS 'ElevenLabs agent config for roleplay activities: {agent_id, voice_id, character_id, scenario, etc.}';



COMMENT ON COLUMN "public"."activities"."character_id" IS 'References the character to use for roleplay activities';



COMMENT ON COLUMN "public"."activities"."agent_id" IS 'ElevenLabs agent ID for roleplay activities, falls back to default if null';



COMMENT ON COLUMN "public"."activities"."rubric_prompt" IS 'AI evaluation rubric for scoring practice sessions';



CREATE TABLE IF NOT EXISTS "public"."activity_eligibility" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "prerequisite_activity_id" "uuid",
    "prerequisite_score_threshold" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "activity_eligibility_check" CHECK (("activity_id" <> "prerequisite_activity_id"))
);


ALTER TABLE "public"."activity_eligibility" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activity_responses" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "response" "jsonb",
    "user_id" "uuid",
    "form_title" "text",
    "form_type" "text",
    "quiz_score" smallint,
    "max_score" smallint,
    "token" "text",
    "activity_id" "uuid"
);


ALTER TABLE "public"."activity_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "is_published" boolean,
    "order_index" smallint DEFAULT '0'::smallint
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."modules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "avatar_image" "text",
    "course_image" "text"
);


ALTER TABLE "public"."modules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."topics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "module_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "order_index" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."topics" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."activity_summaries" AS
 SELECT "a"."id",
    "a"."display_name",
    "a"."internal_name",
    "a"."short_description",
    "a"."loop_type",
    "a"."difficulty",
    "a"."activity_type",
    "a"."is_quiz",
    "a"."order_index",
    "a"."topic_id",
    "t"."title" AS "topic_title",
    "a"."module_id",
    "m"."title" AS "module_title",
    "m"."course_id",
    "c"."title" AS "course_title"
   FROM ((("public"."activities" "a"
     LEFT JOIN "public"."topics" "t" ON (("a"."topic_id" = "t"."id")))
     LEFT JOIN "public"."modules" "m" ON (("a"."module_id" = "m"."id")))
     LEFT JOIN "public"."courses" "c" ON (("m"."course_id" = "c"."id")))
  WHERE ("a"."is_quiz" IS NOT NULL);


ALTER VIEW "public"."activity_summaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."characters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "character_name" character varying(100) NOT NULL,
    "character_slug" character varying(100) NOT NULL,
    "age" integer,
    "gender" character varying(50),
    "pronouns" character varying(20),
    "occupation" character varying(200),
    "relationship_status" character varying(100),
    "coach_facing_blurb" "text" NOT NULL,
    "difficulty_rating" integer NOT NULL,
    "difficulty_label" character varying(20),
    "tags" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "primary_issues" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "personality_traits" "text"[] DEFAULT '{}'::"text"[],
    "current_emotional_state" "text",
    "relationship_history" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "critical_issues" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "recent_trigger_event" "text" NOT NULL,
    "what_character_knows" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "what_character_wants" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "changes_already_made" "text"[] DEFAULT '{}'::"text"[],
    "communication_style" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "characteristic_phrases" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "sample_opening_statements" "text"[] DEFAULT '{}'::"text"[],
    "key_topics" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "key_coaching_challenges" "text"[] DEFAULT '{}'::"text"[],
    "client_presentation_style" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "created_by" "uuid",
    "is_active" boolean DEFAULT true,
    "is_published" boolean DEFAULT false,
    "version" integer DEFAULT 1,
    "profile_image_url" "text",
    CONSTRAINT "characters_difficulty_rating_check" CHECK ((("difficulty_rating" >= 1) AND ("difficulty_rating" <= 5)))
);


ALTER TABLE "public"."characters" OWNER TO "postgres";


COMMENT ON TABLE "public"."characters" IS 'Complete character profiles for NBG role-play practice scenarios. Each character is a static entity with all background info; behavioral variations (difficulty, persona) are added via practice_sessions table.';



COMMENT ON COLUMN "public"."characters"."coach_facing_blurb" IS 'Short summary (200-400 words) shown to coaches when selecting scenarios. Includes situation overview, key challenges, what character wants, and presentation style.';



COMMENT ON COLUMN "public"."characters"."relationship_history" IS 'JSONB containing structured data about current/past relationships, family dynamics, children, friends. Flexible schema to accommodate different character situations.';



COMMENT ON COLUMN "public"."characters"."critical_issues" IS 'JSONB containing core_conflicts array and contributing_factors array. Main problems character is facing.';



COMMENT ON COLUMN "public"."characters"."what_character_knows" IS 'JSONB with self_awareness, about_situation, and beliefs_and_fears arrays. What character understands about their situation.';



COMMENT ON COLUMN "public"."characters"."what_character_wants" IS 'JSONB with primary_goals, secondary_goals, and emotional_needs arrays. What character is seeking from coaching.';



COMMENT ON COLUMN "public"."characters"."communication_style" IS 'JSONB with when_calm, when_anxious, when_defensive, when_vulnerable objects. Each contains description and characteristics array.';



COMMENT ON COLUMN "public"."characters"."characteristic_phrases" IS 'JSONB object with keys for different emotional states (anxious, defensive, etc.) and arrays of phrases they use in those states.';



COMMENT ON COLUMN "public"."characters"."key_topics" IS 'JSONB array of objects with topic, priority (1-10), and nbg_phase fields. Topics character will likely raise during session.';



COMMENT ON COLUMN "public"."characters"."profile_image_url" IS 'URL or path to character profile image stored in Supabase Storage bucket. Images help coaches quickly identify and connect with characters during scenario selection.';



CREATE TABLE IF NOT EXISTS "public"."course_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "current_subject_index" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone,
    "status" "text" DEFAULT 'not_started'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "course_progress_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."course_progress" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."curriculum_hierarchy" AS
 SELECT "c"."id" AS "course_id",
    "c"."title" AS "course_title",
    "c"."description" AS "course_description",
    "c"."order_index" AS "course_order",
    "c"."is_published" AS "course_published",
    "m"."id" AS "module_id",
    "m"."title" AS "module_title",
    "m"."description" AS "module_description",
    "m"."order_index" AS "module_order",
    "a"."id" AS "activity_id",
    "a"."display_name" AS "activity_name",
    "a"."internal_name" AS "activity_internal_name",
    "a"."short_description" AS "activity_description",
    "a"."order_index" AS "activity_order",
    "a"."activity_type",
    "a"."difficulty",
    "a"."is_quiz",
    "a"."published" AS "activity_published",
    "a"."loop_type",
    "a"."avatar_name",
    "a"."avatar_image_url",
    "a"."activity_image_url"
   FROM (("public"."courses" "c"
     LEFT JOIN "public"."modules" "m" ON (("m"."course_id" = "c"."id")))
     LEFT JOIN "public"."activities" "a" ON (("a"."module_id" = "m"."id")))
  WHERE (("c"."is_published" = true) AND (("a"."id" IS NULL) OR ("a"."published" = true)))
  ORDER BY "c"."order_index", "m"."order_index", "a"."order_index";


ALTER VIEW "public"."curriculum_hierarchy" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."module_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "module_id" "uuid" NOT NULL,
    "current_activity_index" integer DEFAULT 0,
    "completed_count" integer DEFAULT 0,
    "last_activity_at" timestamp with time zone,
    "status" "text" DEFAULT 'not_started'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "subject_progress_status_check" CHECK (("status" = ANY (ARRAY['not_started'::"text", 'in_progress'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."module_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_onboarding" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "step" "text" NOT NULL,
    "completed" boolean DEFAULT false,
    "dismissed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "dismissed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_onboarding" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."onboarding_analytics" AS
 SELECT "step",
    "count"(*) AS "total_users",
    "count"(*) FILTER (WHERE "completed") AS "completed_count",
    "count"(*) FILTER (WHERE "dismissed") AS "dismissed_count",
    "round"(((100.0 * ("count"(*) FILTER (WHERE "completed"))::numeric) / (NULLIF("count"(*), 0))::numeric), 2) AS "completion_rate",
    "round"(((100.0 * ("count"(*) FILTER (WHERE "dismissed"))::numeric) / (NULLIF("count"(*), 0))::numeric), 2) AS "dismissal_rate"
   FROM "public"."user_onboarding"
  GROUP BY "step"
  ORDER BY "step";


ALTER VIEW "public"."onboarding_analytics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "call_data" "jsonb",
    "conversation_id" "text",
    "agent_id" "text",
    "activity_id" "uuid",
    "character_id" "uuid",
    "character_name" "text",
    "start_time_unix_secs" bigint,
    "accepted_time_unix_secs" bigint,
    "call_duration_secs" integer,
    "call_successful" "text",
    "did_coach_participate" boolean DEFAULT false,
    "termination_reason" "text",
    "transcript_summary" "text",
    "call_summary_title" "text",
    "transcript" "jsonb",
    "cost_cents" integer,
    "scoring_status" "text",
    CONSTRAINT "practice_sessions_scoring_status_check" CHECK (("scoring_status" = ANY (ARRAY['scoring'::"text", 'scored'::"text", 'failed'::"text"])))
);


ALTER TABLE "public"."practice_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."practice_sessions" IS 'Stores practice voice chat session data including ElevenLabs call information';



COMMENT ON COLUMN "public"."practice_sessions"."scoring_status" IS 'Status of AI scoring workflow: null=not scored, scoring=in progress, scored=complete, failed=error';



CREATE TABLE IF NOT EXISTS "public"."prompts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "label" "text" NOT NULL,
    "template" "text" NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."prompts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scorecards" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_id" "uuid",
    "overall_score" numeric(5,2) NOT NULL,
    "criteria_scores" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "feedback" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "scorecards_overall_score_check" CHECK ((("overall_score" >= (0)::numeric) AND ("overall_score" <= (100)::numeric)))
);


ALTER TABLE "public"."scorecards" OWNER TO "postgres";


COMMENT ON TABLE "public"."scorecards" IS 'AI-generated evaluation scorecards for practice sessions';



COMMENT ON COLUMN "public"."scorecards"."session_id" IS 'Reference to the practice session being scored';



COMMENT ON COLUMN "public"."scorecards"."overall_score" IS 'Overall percentage score from 0-100';



COMMENT ON COLUMN "public"."scorecards"."criteria_scores" IS 'Array of criterion objects with name, score, max_score, and rationale';



COMMENT ON COLUMN "public"."scorecards"."feedback" IS 'Constructive feedback summary from AI evaluation';



CREATE OR REPLACE VIEW "public"."scorecards_with_activity" AS
 SELECT "sc"."id",
    "sc"."session_id",
    "sc"."user_id",
    "sc"."activity_id",
    "sc"."overall_score",
    "sc"."criteria_scores",
    "sc"."feedback",
    "sc"."created_at",
    "sc"."updated_at",
    "a"."display_name" AS "activity_name",
    "a"."internal_name" AS "activity_internal_name",
    "a"."short_description" AS "activity_description",
    "a"."difficulty" AS "activity_difficulty",
    "a"."character_id"
   FROM ("public"."scorecards" "sc"
     LEFT JOIN "public"."activities" "a" ON (("sc"."activity_id" = "a"."id")));


ALTER VIEW "public"."scorecards_with_activity" OWNER TO "postgres";


COMMENT ON VIEW "public"."scorecards_with_activity" IS 'Scorecards joined with activity details for easier querying';



ALTER TABLE "public"."activity_responses" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."typeform-responses_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "activity_id" "uuid" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."user_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "storage"."buckets" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "public" boolean DEFAULT false,
    "avif_autodetection" boolean DEFAULT false,
    "file_size_limit" bigint,
    "allowed_mime_types" "text"[],
    "owner_id" "text",
    "type" "storage"."buckettype" DEFAULT 'STANDARD'::"storage"."buckettype" NOT NULL
);


ALTER TABLE "storage"."buckets" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."buckets"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."buckets_analytics" (
    "name" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'ANALYTICS'::"storage"."buckettype" NOT NULL,
    "format" "text" DEFAULT 'ICEBERG'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "storage"."buckets_analytics" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."buckets_vectors" (
    "id" "text" NOT NULL,
    "type" "storage"."buckettype" DEFAULT 'VECTOR'::"storage"."buckettype" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."buckets_vectors" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."migrations" (
    "id" integer NOT NULL,
    "name" character varying(100) NOT NULL,
    "hash" character varying(40) NOT NULL,
    "executed_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE "storage"."migrations" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."objects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "bucket_id" "text",
    "name" "text",
    "owner" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_accessed_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb",
    "path_tokens" "text"[] GENERATED ALWAYS AS ("string_to_array"("name", '/'::"text")) STORED,
    "version" "text",
    "owner_id" "text",
    "user_metadata" "jsonb",
    "level" integer
);


ALTER TABLE "storage"."objects" OWNER TO "supabase_storage_admin";


COMMENT ON COLUMN "storage"."objects"."owner" IS 'Field is deprecated, use owner_id instead';



CREATE TABLE IF NOT EXISTS "storage"."prefixes" (
    "bucket_id" "text" NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "level" integer GENERATED ALWAYS AS ("storage"."get_level"("name")) STORED NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "storage"."prefixes" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads" (
    "id" "text" NOT NULL,
    "in_progress_size" bigint DEFAULT 0 NOT NULL,
    "upload_signature" "text" NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "version" "text" NOT NULL,
    "owner_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_metadata" "jsonb"
);


ALTER TABLE "storage"."s3_multipart_uploads" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."s3_multipart_uploads_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "upload_id" "text" NOT NULL,
    "size" bigint DEFAULT 0 NOT NULL,
    "part_number" integer NOT NULL,
    "bucket_id" "text" NOT NULL,
    "key" "text" NOT NULL COLLATE "pg_catalog"."C",
    "etag" "text" NOT NULL,
    "owner_id" "text",
    "version" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."s3_multipart_uploads_parts" OWNER TO "supabase_storage_admin";


CREATE TABLE IF NOT EXISTS "storage"."vector_indexes" (
    "id" "text" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL COLLATE "pg_catalog"."C",
    "bucket_id" "text" NOT NULL,
    "data_type" "text" NOT NULL,
    "dimension" integer NOT NULL,
    "distance_metric" "text" NOT NULL,
    "metadata_configuration" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "storage"."vector_indexes" OWNER TO "supabase_storage_admin";


ALTER TABLE ONLY "public"."activity_eligibility"
    ADD CONSTRAINT "activity_eligibility_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_character_slug_key" UNIQUE ("character_slug");



ALTER TABLE ONLY "public"."characters"
    ADD CONSTRAINT "characters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_progress"
    ADD CONSTRAINT "course_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_progress"
    ADD CONSTRAINT "course_progress_user_id_course_id_key" UNIQUE ("user_id", "course_id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_conversation_id_key" UNIQUE ("conversation_id");



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."prompts"
    ADD CONSTRAINT "prompts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scorecards"
    ADD CONSTRAINT "scorecards_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."module_progress"
    ADD CONSTRAINT "subject_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."module_progress"
    ADD CONSTRAINT "subject_progress_user_id_subject_id_key" UNIQUE ("user_id", "module_id");



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "subjects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_responses"
    ADD CONSTRAINT "typeform-responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activity_responses"
    ADD CONSTRAINT "typeform-responses_token_key" UNIQUE ("token");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "typeforms_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."scorecards"
    ADD CONSTRAINT "unique_session_scorecard" UNIQUE ("session_id");



ALTER TABLE ONLY "public"."user_onboarding"
    ADD CONSTRAINT "user_onboarding_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_onboarding"
    ADD CONSTRAINT "user_onboarding_user_id_step_key" UNIQUE ("user_id", "step");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_id_typeform_id_key" UNIQUE ("user_id", "activity_id");



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_user_typeform_unique" UNIQUE ("user_id", "activity_id");



ALTER TABLE ONLY "storage"."buckets_analytics"
    ADD CONSTRAINT "buckets_analytics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets"
    ADD CONSTRAINT "buckets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."buckets_vectors"
    ADD CONSTRAINT "buckets_vectors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_name_key" UNIQUE ("name");



ALTER TABLE ONLY "storage"."migrations"
    ADD CONSTRAINT "migrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."prefixes"
    ADD CONSTRAINT "prefixes_pkey" PRIMARY KEY ("bucket_id", "level", "name");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activities_activity_type" ON "public"."activities" USING "btree" ("activity_type");



CREATE INDEX "idx_activities_difficulty" ON "public"."activities" USING "btree" ("difficulty");



CREATE INDEX "idx_activities_loop_type" ON "public"."activities" USING "btree" ("loop_type");



CREATE INDEX "idx_activities_module_id" ON "public"."activities" USING "btree" ("module_id");



CREATE INDEX "idx_activities_topic_id" ON "public"."activities" USING "btree" ("topic_id");



CREATE INDEX "idx_activity_eligibility_activity_id" ON "public"."activity_eligibility" USING "btree" ("activity_id");



CREATE INDEX "idx_activity_eligibility_prerequisite" ON "public"."activity_eligibility" USING "btree" ("prerequisite_activity_id");



CREATE INDEX "idx_characters_active" ON "public"."characters" USING "btree" ("is_active") WHERE ("is_active" = true);



CREATE INDEX "idx_characters_active_published" ON "public"."characters" USING "btree" ("is_active", "is_published") WHERE (("is_active" = true) AND ("is_published" = true));



CREATE INDEX "idx_characters_communication_style" ON "public"."characters" USING "gin" ("communication_style");



CREATE INDEX "idx_characters_critical_issues" ON "public"."characters" USING "gin" ("critical_issues");



CREATE INDEX "idx_characters_difficulty" ON "public"."characters" USING "btree" ("difficulty_rating");



CREATE INDEX "idx_characters_has_image" ON "public"."characters" USING "btree" ((("profile_image_url" IS NOT NULL)));



CREATE INDEX "idx_characters_key_topics" ON "public"."characters" USING "gin" ("key_topics");



CREATE INDEX "idx_characters_primary_issues" ON "public"."characters" USING "gin" ("primary_issues");



CREATE INDEX "idx_characters_published" ON "public"."characters" USING "btree" ("is_published") WHERE ("is_published" = true);



CREATE INDEX "idx_characters_relationship_history" ON "public"."characters" USING "gin" ("relationship_history");



CREATE INDEX "idx_characters_slug" ON "public"."characters" USING "btree" ("character_slug");



CREATE INDEX "idx_characters_tags" ON "public"."characters" USING "gin" ("tags");



CREATE INDEX "idx_course_progress_course_id" ON "public"."course_progress" USING "btree" ("course_id");



CREATE INDEX "idx_course_progress_status" ON "public"."course_progress" USING "btree" ("status");



CREATE INDEX "idx_course_progress_user_id" ON "public"."course_progress" USING "btree" ("user_id");



CREATE INDEX "idx_practice_sessions_activity_id" ON "public"."practice_sessions" USING "btree" ("activity_id");



CREATE INDEX "idx_practice_sessions_character_id" ON "public"."practice_sessions" USING "btree" ("character_id");



CREATE INDEX "idx_practice_sessions_conversation_id" ON "public"."practice_sessions" USING "btree" ("conversation_id");



CREATE INDEX "idx_practice_sessions_created_at" ON "public"."practice_sessions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_practice_sessions_did_coach_participate" ON "public"."practice_sessions" USING "btree" ("did_coach_participate") WHERE ("did_coach_participate" = true);



CREATE INDEX "idx_practice_sessions_user_id" ON "public"."practice_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_scorecards_activity_id" ON "public"."scorecards" USING "btree" ("activity_id");



CREATE INDEX "idx_scorecards_created_at" ON "public"."scorecards" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_scorecards_session_id" ON "public"."scorecards" USING "btree" ("session_id");



CREATE INDEX "idx_scorecards_user_id" ON "public"."scorecards" USING "btree" ("user_id");



CREATE INDEX "idx_subject_progress_status" ON "public"."module_progress" USING "btree" ("status");



CREATE INDEX "idx_subject_progress_subject_id" ON "public"."module_progress" USING "btree" ("module_id");



CREATE INDEX "idx_subject_progress_user_id" ON "public"."module_progress" USING "btree" ("user_id");



CREATE INDEX "idx_subjects_course_id" ON "public"."modules" USING "btree" ("course_id");



CREATE INDEX "idx_topics_module_id" ON "public"."topics" USING "btree" ("module_id");



CREATE INDEX "idx_typeforms_subject_id" ON "public"."activities" USING "btree" ("module_id");



CREATE INDEX "idx_user_onboarding_step" ON "public"."user_onboarding" USING "btree" ("step");



CREATE INDEX "idx_user_onboarding_user_id" ON "public"."user_onboarding" USING "btree" ("user_id");



CREATE INDEX "idx_user_progress_typeform_id" ON "public"."user_progress" USING "btree" ("activity_id");



CREATE INDEX "idx_user_progress_user_id" ON "public"."user_progress" USING "btree" ("user_id");



CREATE INDEX "practice_sessions_created_at_idx" ON "public"."practice_sessions" USING "btree" ("created_at" DESC);



CREATE INDEX "practice_sessions_user_id_idx" ON "public"."practice_sessions" USING "btree" ("user_id");



CREATE UNIQUE INDEX "bname" ON "storage"."buckets" USING "btree" ("name");



CREATE UNIQUE INDEX "bucketid_objname" ON "storage"."objects" USING "btree" ("bucket_id", "name");



CREATE UNIQUE INDEX "buckets_analytics_unique_name_idx" ON "storage"."buckets_analytics" USING "btree" ("name") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_multipart_uploads_list" ON "storage"."s3_multipart_uploads" USING "btree" ("bucket_id", "key", "created_at");



CREATE UNIQUE INDEX "idx_name_bucket_level_unique" ON "storage"."objects" USING "btree" ("name" COLLATE "C", "bucket_id", "level");



CREATE INDEX "idx_objects_bucket_id_name" ON "storage"."objects" USING "btree" ("bucket_id", "name" COLLATE "C");



CREATE INDEX "idx_objects_lower_name" ON "storage"."objects" USING "btree" (("path_tokens"["level"]), "lower"("name") "text_pattern_ops", "bucket_id", "level");



CREATE INDEX "idx_prefixes_lower_name" ON "storage"."prefixes" USING "btree" ("bucket_id", "level", (("string_to_array"("name", '/'::"text"))["level"]), "lower"("name") "text_pattern_ops");



CREATE INDEX "name_prefix_search" ON "storage"."objects" USING "btree" ("name" "text_pattern_ops");



CREATE UNIQUE INDEX "objects_bucket_id_level_idx" ON "storage"."objects" USING "btree" ("bucket_id", "level", "name" COLLATE "C");



CREATE UNIQUE INDEX "vector_indexes_name_bucket_id_idx" ON "storage"."vector_indexes" USING "btree" ("name", "bucket_id");



CREATE OR REPLACE TRIGGER "new-activity-response-to-make" AFTER INSERT ON "public"."activity_responses" FOR EACH ROW EXECUTE FUNCTION "supabase_functions"."http_request"('https://hook.us2.make.com/8gpct8t9xr94c1chyd4oup3khhxfuusf', 'POST', '{"Content-type":"application/json"}', '{}', '5000');



CREATE OR REPLACE TRIGGER "trigger_process_typeform_response" AFTER INSERT ON "public"."activity_responses" FOR EACH ROW EXECUTE FUNCTION "public"."process_typeform_response"();



CREATE OR REPLACE TRIGGER "update_characters_updated_at" BEFORE UPDATE ON "public"."characters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_course_progress_updated_at" BEFORE UPDATE ON "public"."course_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_scorecards_updated_at_trigger" BEFORE UPDATE ON "public"."scorecards" FOR EACH ROW EXECUTE FUNCTION "public"."update_scorecards_updated_at"();



CREATE OR REPLACE TRIGGER "update_subject_progress_updated_at" BEFORE UPDATE ON "public"."module_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_onboarding_updated_at" BEFORE UPDATE ON "public"."user_onboarding" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "enforce_bucket_name_length_trigger" BEFORE INSERT OR UPDATE OF "name" ON "storage"."buckets" FOR EACH ROW EXECUTE FUNCTION "storage"."enforce_bucket_name_length"();



CREATE OR REPLACE TRIGGER "objects_delete_delete_prefix" AFTER DELETE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();



CREATE OR REPLACE TRIGGER "objects_insert_create_prefix" BEFORE INSERT ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."objects_insert_prefix_trigger"();



CREATE OR REPLACE TRIGGER "objects_update_create_prefix" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW WHEN ((("new"."name" <> "old"."name") OR ("new"."bucket_id" <> "old"."bucket_id"))) EXECUTE FUNCTION "storage"."objects_update_prefix_trigger"();



CREATE OR REPLACE TRIGGER "prefixes_create_hierarchy" BEFORE INSERT ON "storage"."prefixes" FOR EACH ROW WHEN (("pg_trigger_depth"() < 1)) EXECUTE FUNCTION "storage"."prefixes_insert_trigger"();



CREATE OR REPLACE TRIGGER "prefixes_delete_hierarchy" AFTER DELETE ON "storage"."prefixes" FOR EACH ROW EXECUTE FUNCTION "storage"."delete_prefix_hierarchy_trigger"();



CREATE OR REPLACE TRIGGER "update_objects_updated_at" BEFORE UPDATE ON "storage"."objects" FOR EACH ROW EXECUTE FUNCTION "storage"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "public"."topics"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_eligibility"
    ADD CONSTRAINT "activity_eligibility_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_eligibility"
    ADD CONSTRAINT "activity_eligibility_prerequisite_activity_id_fkey" FOREIGN KEY ("prerequisite_activity_id") REFERENCES "public"."activities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activity_responses"
    ADD CONSTRAINT "activity_responses_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_progress"
    ADD CONSTRAINT "course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."module_progress"
    ADD CONSTRAINT "module_progress_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id");



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_character_id_fkey" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id");



ALTER TABLE ONLY "public"."practice_sessions"
    ADD CONSTRAINT "practice_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scorecards"
    ADD CONSTRAINT "scorecards_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."scorecards"
    ADD CONSTRAINT "scorecards_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."scorecards"
    ADD CONSTRAINT "scorecards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."modules"
    ADD CONSTRAINT "subjects_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."topics"
    ADD CONSTRAINT "topics_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."activity_responses"
    ADD CONSTRAINT "typeform-responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."user_onboarding"
    ADD CONSTRAINT "user_onboarding_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_progress"
    ADD CONSTRAINT "user_progress_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."objects"
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."prefixes"
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads"
    ADD CONSTRAINT "s3_multipart_uploads_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets"("id");



ALTER TABLE ONLY "storage"."s3_multipart_uploads_parts"
    ADD CONSTRAINT "s3_multipart_uploads_parts_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "storage"."s3_multipart_uploads"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "storage"."vector_indexes"
    ADD CONSTRAINT "vector_indexes_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "storage"."buckets_vectors"("id");



CREATE POLICY "Allow read access to topics" ON "public"."topics" FOR SELECT USING (true);



CREATE POLICY "Service role can insert scorecards" ON "public"."scorecards" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can delete own onboarding" ON "public"."user_onboarding" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own scorecards" ON "public"."scorecards" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own practice sessions" ON "public"."practice_sessions" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own onboarding" ON "public"."user_onboarding" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own practice sessions" ON "public"."practice_sessions" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own onboarding" ON "public"."user_onboarding" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own scorecards" ON "public"."scorecards" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own practice sessions" ON "public"."practice_sessions" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own onboarding" ON "public"."user_onboarding" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own scorecards" ON "public"."scorecards" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own practice sessions" ON "public"."practice_sessions" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_eligibility" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activity_responses" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "all" ON "public"."activities" USING (true);



CREATE POLICY "all" ON "public"."activity_eligibility" USING (true);



CREATE POLICY "all" ON "public"."activity_responses" USING (true);



CREATE POLICY "all" ON "public"."course_progress" USING (true);



CREATE POLICY "all" ON "public"."courses" USING (true);



CREATE POLICY "all" ON "public"."module_progress" USING (true);



CREATE POLICY "all" ON "public"."modules" USING (true);



CREATE POLICY "all" ON "public"."user_progress" USING (true);



ALTER TABLE "public"."course_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."module_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."modules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."practice_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."scorecards" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."topics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_onboarding" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Authenticated users can delete" ON "storage"."objects" FOR DELETE USING ((("bucket_id" = 'character-profiles'::"text") AND ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Authenticated users can update" ON "storage"."objects" FOR UPDATE USING ((("bucket_id" = 'character-profiles'::"text") AND ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Authenticated users can upload" ON "storage"."objects" FOR INSERT WITH CHECK ((("bucket_id" = 'character-profiles'::"text") AND ("auth"."role"() = 'authenticated'::"text")));



CREATE POLICY "Public Access" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'character-profiles'::"text"));



CREATE POLICY "all 1la6xv8_0" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'onboarding-vids'::"text"));



CREATE POLICY "all 1la6xv8_1" ON "storage"."objects" FOR INSERT WITH CHECK (("bucket_id" = 'onboarding-vids'::"text"));



CREATE POLICY "all 1la6xv8_2" ON "storage"."objects" FOR UPDATE USING (("bucket_id" = 'onboarding-vids'::"text"));



CREATE POLICY "all 1la6xv8_3" ON "storage"."objects" FOR DELETE USING (("bucket_id" = 'onboarding-vids'::"text"));



CREATE POLICY "all 6cu2so_0" ON "storage"."objects" FOR SELECT USING (("bucket_id" = 'activity_images'::"text"));



CREATE POLICY "all 6cu2so_1" ON "storage"."objects" FOR INSERT WITH CHECK (("bucket_id" = 'activity_images'::"text"));



CREATE POLICY "all 6cu2so_2" ON "storage"."objects" FOR UPDATE USING (("bucket_id" = 'activity_images'::"text"));



CREATE POLICY "all 6cu2so_3" ON "storage"."objects" FOR DELETE USING (("bucket_id" = 'activity_images'::"text"));



ALTER TABLE "storage"."buckets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_analytics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."buckets_vectors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."migrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."objects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."prefixes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."s3_multipart_uploads_parts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "storage"."vector_indexes" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT USAGE ON SCHEMA "storage" TO "postgres" WITH GRANT OPTION;
GRANT USAGE ON SCHEMA "storage" TO "anon";
GRANT USAGE ON SCHEMA "storage" TO "authenticated";
GRANT USAGE ON SCHEMA "storage" TO "service_role";
GRANT ALL ON SCHEMA "storage" TO "supabase_storage_admin";
GRANT ALL ON SCHEMA "storage" TO "dashboard_user";



GRANT ALL ON FUNCTION "public"."initialize_course_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_course_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_course_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_typeform_response"() TO "anon";
GRANT ALL ON FUNCTION "public"."process_typeform_response"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_typeform_response"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_activity_responses_to_progress"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_activity_responses_to_progress"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_activity_responses_to_progress"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_progress_on_completion"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_progress_on_completion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_progress_on_completion"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_scorecards_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_scorecards_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_scorecards_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."activity_eligibility" TO "anon";
GRANT ALL ON TABLE "public"."activity_eligibility" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_eligibility" TO "service_role";



GRANT ALL ON TABLE "public"."activity_responses" TO "anon";
GRANT ALL ON TABLE "public"."activity_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_responses" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."modules" TO "anon";
GRANT ALL ON TABLE "public"."modules" TO "authenticated";
GRANT ALL ON TABLE "public"."modules" TO "service_role";



GRANT ALL ON TABLE "public"."topics" TO "anon";
GRANT ALL ON TABLE "public"."topics" TO "authenticated";
GRANT ALL ON TABLE "public"."topics" TO "service_role";



GRANT ALL ON TABLE "public"."activity_summaries" TO "anon";
GRANT ALL ON TABLE "public"."activity_summaries" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_summaries" TO "service_role";



GRANT ALL ON TABLE "public"."characters" TO "anon";
GRANT ALL ON TABLE "public"."characters" TO "authenticated";
GRANT ALL ON TABLE "public"."characters" TO "service_role";



GRANT ALL ON TABLE "public"."course_progress" TO "anon";
GRANT ALL ON TABLE "public"."course_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."course_progress" TO "service_role";



GRANT ALL ON TABLE "public"."curriculum_hierarchy" TO "anon";
GRANT ALL ON TABLE "public"."curriculum_hierarchy" TO "authenticated";
GRANT ALL ON TABLE "public"."curriculum_hierarchy" TO "service_role";



GRANT ALL ON TABLE "public"."module_progress" TO "anon";
GRANT ALL ON TABLE "public"."module_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."module_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_onboarding" TO "anon";
GRANT ALL ON TABLE "public"."user_onboarding" TO "authenticated";
GRANT ALL ON TABLE "public"."user_onboarding" TO "service_role";



GRANT ALL ON TABLE "public"."onboarding_analytics" TO "anon";
GRANT ALL ON TABLE "public"."onboarding_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."onboarding_analytics" TO "service_role";



GRANT ALL ON TABLE "public"."practice_sessions" TO "anon";
GRANT ALL ON TABLE "public"."practice_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."prompts" TO "anon";
GRANT ALL ON TABLE "public"."prompts" TO "authenticated";
GRANT ALL ON TABLE "public"."prompts" TO "service_role";



GRANT ALL ON TABLE "public"."scorecards" TO "anon";
GRANT ALL ON TABLE "public"."scorecards" TO "authenticated";
GRANT ALL ON TABLE "public"."scorecards" TO "service_role";



GRANT ALL ON TABLE "public"."scorecards_with_activity" TO "anon";
GRANT ALL ON TABLE "public"."scorecards_with_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."scorecards_with_activity" TO "service_role";



GRANT ALL ON SEQUENCE "public"."typeform-responses_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."typeform-responses_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."typeform-responses_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_progress" TO "service_role";



REVOKE ALL ON TABLE "storage"."buckets" FROM "supabase_storage_admin";
GRANT ALL ON TABLE "storage"."buckets" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."buckets" TO "anon";
GRANT ALL ON TABLE "storage"."buckets" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."buckets_analytics" TO "service_role";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "authenticated";
GRANT ALL ON TABLE "storage"."buckets_analytics" TO "anon";



GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "service_role";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "authenticated";
GRANT SELECT ON TABLE "storage"."buckets_vectors" TO "anon";



REVOKE ALL ON TABLE "storage"."objects" FROM "supabase_storage_admin";
GRANT ALL ON TABLE "storage"."objects" TO "supabase_storage_admin" WITH GRANT OPTION;
GRANT ALL ON TABLE "storage"."objects" TO "anon";
GRANT ALL ON TABLE "storage"."objects" TO "authenticated";
GRANT ALL ON TABLE "storage"."objects" TO "service_role";
GRANT ALL ON TABLE "storage"."objects" TO "postgres" WITH GRANT OPTION;



GRANT ALL ON TABLE "storage"."prefixes" TO "service_role";
GRANT ALL ON TABLE "storage"."prefixes" TO "authenticated";
GRANT ALL ON TABLE "storage"."prefixes" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads" TO "anon";



GRANT ALL ON TABLE "storage"."s3_multipart_uploads_parts" TO "service_role";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "authenticated";
GRANT SELECT ON TABLE "storage"."s3_multipart_uploads_parts" TO "anon";



GRANT SELECT ON TABLE "storage"."vector_indexes" TO "service_role";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "authenticated";
GRANT SELECT ON TABLE "storage"."vector_indexes" TO "anon";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON SEQUENCES TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON FUNCTIONS TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "storage" GRANT ALL ON TABLES TO "service_role";




