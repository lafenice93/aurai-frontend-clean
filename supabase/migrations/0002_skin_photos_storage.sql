-- 피부(얼굴) 사진 버킷. 비공개 — 조회는 서명 URL로만.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'skin-photos',
  'skin-photos',
  false,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 경로 규칙: {auth.uid()}/{uuid}.{ext}
-- 첫 번째 폴더가 요청자 본인의 uid일 때만 허용한다. anon(비로그인)에는 어떤 정책도 열지 않는다.
-- storage.objects는 Supabase가 기본으로 RLS를 켜 두므로, 아래 정책 밖의 접근은 전부 거부된다.

drop policy if exists "skin-photos: 본인 폴더에만 업로드" on storage.objects;
create policy "skin-photos: 본인 폴더에만 업로드"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'skin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "skin-photos: 본인 사진만 조회" on storage.objects;
create policy "skin-photos: 본인 사진만 조회"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'skin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "skin-photos: 본인 사진만 교체" on storage.objects;
create policy "skin-photos: 본인 사진만 교체"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'skin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'skin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "skin-photos: 본인 사진만 삭제" on storage.objects;
create policy "skin-photos: 본인 사진만 삭제"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'skin-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- TODO: 보관기간·삭제 정책 결정 필요.
--   정해지면 여기서 만료 객체를 지우는 스케줄(pg_cron) 또는 Edge Function을 추가한다.
