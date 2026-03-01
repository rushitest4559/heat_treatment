npx directus schema snapshot ./snapshot.yaml
npx directus schema-sync export

npx directus schema apply ./snapshot.yaml
npx directus schema-sync import