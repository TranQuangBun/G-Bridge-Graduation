-- Update subscription plan prices to more affordable range ($5-$20)

UPDATE `subscription_plans` SET `price` = 5.00 WHERE `name` = 'basic';
UPDATE `subscription_plans` SET `price` = 12.00 WHERE `name` = 'pro';
UPDATE `subscription_plans` SET `price` = 20.00 WHERE `name` = 'enterprise';
UPDATE `subscription_plans` SET `price` = 48.00 WHERE `name` = 'basic_yearly';
UPDATE `subscription_plans` SET `price` = 115.20 WHERE `name` = 'pro_yearly';

-- Verify the update
SELECT id, name, displayName, price, currency, duration FROM `subscription_plans` WHERE isActive = TRUE;
