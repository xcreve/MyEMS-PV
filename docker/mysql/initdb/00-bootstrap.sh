#!/bin/sh
set -eu

echo "Bootstrapping RuoYi + PV schema into ${MYSQL_DATABASE}"

mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" \
  -e "ALTER DATABASE \`${MYSQL_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"

for sql_file in \
  /opt/bootstrap/sql/ry_20260321.sql \
  /opt/bootstrap/sql/quartz.sql \
  /opt/bootstrap/sql/myems_pv.sql
do
  echo "Importing ${sql_file}"
  mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" < "${sql_file}"
done

mysql --protocol=socket -uroot -p"${MYSQL_ROOT_PASSWORD}" "${MYSQL_DATABASE}" <<'SQL'
update sys_config
set config_value = 'false',
    update_by = 'docker-init',
    update_time = sysdate()
where config_key = 'sys.account.captchaEnabled';
SQL

echo "Bootstrap completed"

