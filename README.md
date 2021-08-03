# LMS course rooms batch

- Install all dependencies

  ```
  npm install
  ```

- Run the app in development mode

  ```
  npm run dev
  ```

### 📝 Checklist for production

- [ ] Change the `name` (and author, if needed) in `package.json`
- [ ] Change the `IMAGE_NAME` in `docker.conf`
- [ ] Modify the `LICENSE` if needed

---

## Philosophy

This template does not make any assumptions on what kind of application you are building

### What does NOT contain?

Any **feature** or decision:

- Routes. It is up to you to decide how to organise routes and routers
- Template library. You decide if you **need** them and which one to use
- Session handling, authentication, access to database, etc.

### What does contain?

- Configuration files: `.gitignore`, `.prettierignore`, `.dockerignore`, etc.
- Dev dependencies: prettier and eslint for formatting and linting; jest for testing
- NPM commands: `npm test`, `npm run format`, `npm start` and `npm run dev`
- KTH-specific Docker-related files: `docker.conf`, `Dockerfile`, `docker-compose-unit-tests.yml`, `.dockerignore`

## Contributing

You can contribute to this project by opening issue or PRs to it.
