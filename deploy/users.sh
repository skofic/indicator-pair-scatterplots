#!/bin/sh
# The site's users (HTTP basic authentication in Caddy). Run ON the server, in the deploy directory:
#   ./users.sh add <name>      a new user, or a new password for an existing one; the password is printed once
#   ./users.sh remove <name>   the user is refused from the next request on
#   ./users.sh list
# With no user the site is open; with at least one, every page, map file and service answer asks for a name and
# password. Only password hashes are stored (auth/users.txt); any site of the Caddyfile that imports
# /etc/caddy/auth/*.caddy shares the same users.
set -eu
cd "$(dirname "$0")"; mkdir -p auth; touch auth/users.txt; chmod 600 auth/users.txt
name=${2:-}
valid() { echo "$name" | grep -Eq '^[a-z0-9._-]{2,32}$' || { echo "name: 2 to 32 of a-z 0-9 . _ -"; exit 1; }; }
apply() {
  if [ -s auth/users.txt ]; then { echo "basic_auth {"; sed 's/^/\t/' auth/users.txt; echo "}"; } > auth/users.caddy; else rm -f auth/users.caddy; fi
  docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile >/dev/null 2>&1 && echo "applied" || { echo "the web server refused the change: docker compose logs caddy"; exit 1; }
}
case "${1:-}" in
  add) valid
    pw=$(LC_ALL=C tr -dc 'a-km-zA-HJ-NP-Z2-9' < /dev/urandom | head -c 16)
    hash=$(docker compose exec -T caddy caddy hash-password --plaintext "$pw")
    grep -v "^$name " auth/users.txt > auth/users.tmp || true; echo "$name $hash" >> auth/users.tmp; mv auth/users.tmp auth/users.txt; chmod 600 auth/users.txt
    apply; echo "user: $name"; echo "password: $pw   (shown this once; it is not stored)" ;;
  remove) valid
    grep -q "^$name " auth/users.txt || { echo "no such user: $name"; exit 1; }
    grep -v "^$name " auth/users.txt > auth/users.tmp || true; mv auth/users.tmp auth/users.txt; chmod 600 auth/users.txt
    apply; [ -s auth/users.txt ] || echo "no user left: the site is open" ;;
  list) if [ -s auth/users.txt ]; then cut -d' ' -f1 auth/users.txt; else echo "no user: the site is open"; fi ;;
  *) echo "usage: $0 add <name> | remove <name> | list"; exit 1 ;;
esac
