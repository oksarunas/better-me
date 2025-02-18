-- Begin transaction
BEGIN;

-- Update existing progress records with new habit names
UPDATE progress 
SET habit = CASE habit
    WHEN '7 hours of sleep' THEN '7 hours of sleep'
    WHEN 'Healthy Breakfast' THEN 'Healthy Breakfast'
    WHEN 'Workout for 30 minutes' THEN 'Workout for 30 minutes'
    WHEN 'Work on personal project for an hour' THEN 'Work on personal project for an hour'
    WHEN '5 g of creatine' THEN '5 g of creatine'
    WHEN 'Read for 20 minutes' THEN 'Read for 20 minutes'
    WHEN 'Multivitamins' THEN 'Multivitamins'
    WHEN 'No alcohol' THEN 'No alcohol'
    ELSE habit
END
WHERE habit IN (
    '7 hours of sleep',
    'Healthy Breakfast',
    'Workout for 30 minutes',
    'Work on personal project for an hour',
    '5 g of creatine',
    'Read for 20 minutes',
    'Multivitamins',
    'No alcohol'
);

-- Commit transaction
COMMIT;
