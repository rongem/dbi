select HAS_PERMS_BY_NAME(NULL, NULL, 'CREATE LOGIN');

select HAS_PERMS_BY_NAME(NULL, 'DATABASE', 'CREATE USER');

select * from fn_my_permissions( NULL, 'SERVER') ORDER BY permission_name;

select * from fn_my_permissions( NULL, 'DATABASE') ORDER BY permission_name;

