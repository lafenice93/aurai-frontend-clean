-- 대화 단위 상태. id는 클라이언트가 만든 conversationId(uuid)를 그대로 쓴다.
create table if not exists public.conversations (
  id uuid primary key,
  user_name text,
  skin_type text check (skin_type in (
    'dry', 'oily', 'combination', 'sensitive', 'dehydrated-oily', 'normal'
  )),
  concern text check (concern in (
    'dryness-flaking', 'sebum-pores', 'acne-trouble', 'redness-sensitivity',
    'pigmentation-tone', 'wrinkles-elasticity', 'scars'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 제품 사진 분석 결과. 한 대화에서 여러 번 찍을 수 있으므로 1:N.
create table if not exists public.product_analyses (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  result jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists product_analyses_conversation_idx
  on public.product_analyses (conversation_id, created_at desc);

-- 서버 API 라우트만 시크릿 키로 쓴다. 퍼블리셔블(anon) 키에는 아무 정책도 열지 않는다.
alter table public.conversations enable row level security;
alter table public.product_analyses enable row level security;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists conversations_touch_updated_at on public.conversations;
create trigger conversations_touch_updated_at
  before update on public.conversations
  for each row execute function public.touch_updated_at();
