# Wambi v4.0

This is a [Next.js](https://nextjs.org/) project bootstrapped with
[`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

1. Install dependencies

- Tip: Make sure you have nvm installed

  - run `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash`
  - or `brew install nvm`

- Tip: Make sure npm is on version 6.14.4. Our bcrypt version doesn't exist beyond npm 7

  - If /node-modules exists, delete `/node-modules` from the root folder
  - Run `npm install -g npm@6.14.4` or `nvm install 14.10.0`
  - Run `npm install` in the root folder

- Tip: Run the following to use the designated node version for this app
  - `nvm install -s`
  - `nvm use`

```sh
npm install
```

2. Start the development server

```sh
npm run dev
```

3. Open the app in your browser
   [http://localhost:3000/](http://localhost:3000/)

4. You are ready!
   You can start editing files under `pages/` or `components/`. The pages will
   auto-update as you edit and save.

## General Guidelines

1. Write clean, concise, readable code
2. Use hooks when possible
3. Componentize where possible
4. Add IDs to all inputs, buttons, links, changing divs, etc. to make automation easier

## Pull Requests

- Prior to creating a PR, format your code using prettier and verify all linting rules are met. Then run the following locally as a check before you push:

```sh
npm run lint
```

- Keep all PR's standard, prepending either `feature/`, `task/`, `bug/`, or `noticket/` to your branch name
- Add JIRA ticket ID to branch/PR names and include link to ticket in PR description
- When posting PRs to slack, make sure to include both PR and JIRA links
- For example:
  `feature/WP-XXX-multiply-pickachus`
  `noticket/multiply-pikachus`
- For releases, we should tag versions like `v4.0` and hotfixes like `hotfix/v4.0.1`

## Comment

- Add comments wherever possible to help the next person understand what is being done
- Add TODOs for future functions/tasks that will be added
- Add your initials at the end of comments so people know where to direct questions
- For example:

```sh
// TODO: Create function to multiply pikachus...KA
```

## Recommended/Nice-to-Have Visual Studio Code extensions

- Color Highlight (highlights all colors in their actual color, even hex)
- Bracket Pair Colorizer (colorizes all matching brackets)
- prettier (formats code nicely)
- SVG Viewer (lets you view SVG files as images right in VS Code)
- vscode-styled-components (displays styled-components css more prettily)
- GitLens (helps you see git changes, previous commits, etc)
- env-cmd-file-syntax (prettifies env files)
- jtladeiras.vscode-inline-sql (Inline SQL formatting)
- Turbo Console Log (Easily adds console logs for variables)

## Resources

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial
- [Vercel Platform](https://vercel.com/import) - deploying Next.js apps
