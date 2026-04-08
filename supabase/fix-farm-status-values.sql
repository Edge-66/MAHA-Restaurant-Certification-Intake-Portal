-- Normalize farm status values so the app (.eq('status', 'approved')) matches reliably.
-- Run in SQL Editor if Table Editor shows "approved" but directory still lists zero.

-- 1) Inspect exact values (look for spaces or odd casing)
-- select distinct status, length(status), ascii(left(status, 1)) from farms order by 1;

-- 2) Normalize: lowercase, trim spaces
update farms
set status = lower(trim(status))
where status is not null;

-- 3) Confirm how many are approved vs pending
-- select status, count(*) from farms group by status;
