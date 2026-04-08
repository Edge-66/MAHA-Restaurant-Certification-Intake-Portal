-- Normalize legacy status casing/spacing so directory visibility is consistent.
-- Safe to run multiple times.

UPDATE farms
SET status = lower(trim(status))
WHERE status IS NOT NULL
  AND status <> lower(trim(status));

-- Optional quick verification
SELECT status, count(*) AS rows
FROM farms
GROUP BY status
ORDER BY status;
