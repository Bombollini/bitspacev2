-- Create task_attachments bucket
insert into storage.buckets (id, name, public) values ('task_attachments', 'task_attachments', true)
on conflict (id) do nothing;

create policy "Task Attachments are publicly accessible"
  on storage.objects for select
  using ( bucket_id = 'task_attachments' );

create policy "Anyone can upload a task attachment"
  on storage.objects for insert
  with check ( bucket_id = 'task_attachments' AND auth.role() = 'authenticated' );

-- Add attachment_url to tasks table
alter table public.tasks 
add column if not exists attachment_url text;
