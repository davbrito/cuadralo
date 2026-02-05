


ALTER TABLE IF EXISTS public.service
    OWNER to postgres;

ALTER TABLE IF EXISTS public.service
    ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.service TO anon;

GRANT ALL ON TABLE public.service TO authenticated;

GRANT ALL ON TABLE public.service TO postgres;

GRANT ALL ON TABLE public.service TO service_role;

COMMENT ON TABLE public.service
    IS 'Servicio a ofrecer con su propia cola de reservas aisladas';

COMMENT ON COLUMN public.service.name
    IS 'Nombre del servicio ofrecido (Eg: Barberia)';
-- Index: service_user_id_name_unique_idx

-- DROP INDEX IF EXISTS public.service_user_id_name_unique_idx;

CREATE UNIQUE INDEX IF NOT EXISTS service_user_id_name_unique_idx
    ON public.service USING btree
    (user_id ASC NULLS LAST, name COLLATE pg_catalog."default" ASC NULLS LAST)
    WITH (fillfactor=100, deduplicate_items=True)
    TABLESPACE pg_default;
-- POLICY: Enable delete access for users based on user_id

-- DROP POLICY IF EXISTS "Enable delete access for users based on user_id" ON public.service;

CREATE POLICY "Enable delete access for users based on user_id"
    ON public.service
    AS PERMISSIVE
    FOR DELETE
    TO authenticated
    USING ((( SELECT auth.uid() AS uid) = user_id));
-- POLICY: Enable insert access for users based on user_id

-- DROP POLICY IF EXISTS "Enable insert access for users based on user_id" ON public.service;

CREATE POLICY "Enable insert access for users based on user_id"
    ON public.service
    AS PERMISSIVE
    FOR INSERT
    TO authenticated
    WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
-- POLICY: Enable select access for users based on user_id

-- DROP POLICY IF EXISTS "Enable select access for users based on user_id" ON public.service;

CREATE POLICY "Enable select access for users based on user_id"
    ON public.service
    AS PERMISSIVE
    FOR SELECT
    TO authenticated
    USING ((( SELECT auth.uid() AS uid) = user_id));
-- POLICY: Enable update access for users based on user_id

-- DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON public.service;

CREATE POLICY "Enable update access for users based on user_id"
    ON public.service
    AS PERMISSIVE
    FOR UPDATE
    TO authenticated
    USING ((( SELECT auth.uid() AS uid) = user_id))
    WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));