# API GATEWAY MICROSERVICE | rsc-evt

<img width='200px' height='200px' src='https://firebasestorage.googleapis.com/v0/b/booknowgotlk.appspot.com/o/BooknowDotLk.svg?alt=media&token=3fcebb25-399a-414a-a229-257f00992b19'/>

## Table of Contents

- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [Folder Structure](#folder-structure)
- [Environment Variables](#environment-variables)
- [Git Workflow](#git-workflow)
- [Git Branching Naming Convention](#git-branching-naming-convention)
- [Api Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

**rsc-evt** is a transaction handling platform where users can browse through a list of selling items, view details, and order goods for them. The application leverages modern web technologies to ensure a smooth and efficient user experience.

## Tech Stack

- Node.js
- MySQL

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 20.x or later)
- [npm](https://www.npmjs.com/) or [Yarn](https://yarnpkg.com/)
- MySQL database **(An empty database must exist. It will not be created automatically.)**

### Installation

1. Clone the repository:

```bash
git clone https://github.com/4kraken4/rsc-evt-api-gateway-service.git
cd rsc-evt-api-gateway-service
```

2. Install dependencies

```bash
  npm install
```

### Running the Service

To start the **development** server, run:

```bash
  npm run dev
```

To start the **production** server, run:

```bash
  npm start
```

The application will be available at http://localhost:9000.

## Folder Structure

Here is the folder structure of the project:

```bash
rsc-evt-api-gateway-service/
├── .github/
│   ├── workflows/
│   │   ├── ci-cd.yml
├── logs/
│   ├── rsc-evt.log
├── src/
│   ├── config/
│   │   ├── config.js
│   │   ├── swagger.js
│   ├── controllers/
│   │   ├── authController.js
│   ├── infrastructure/
│   │   ├── proxies/
│   │   │   ├── AuthProxy.js
│   │   ├── logger/
│   │   │   ├── logger.js
│   │   ├── middlewares/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   ├── interfaces/
│   │   ├── http/
│   │   │   ├── routes/
│   │   │   │   ├── index.js
│   │   │   │   ├── authRoutes.js
│   │   │   ├── HttpClient.js
│   ├── utils/
│   ├── .env.development
│   ├── .env.production
│   ├── app.js
│   ├── server.js
├── tests/
│   ├── config/
│   ├── controllers/
│   │   ├── authController.test.js
│   ├── infrastructure/
│   │   ├── proxies/
│   │   ├── logger/
│   │   ├── middlewares/
│   ├── interfaces/
│   │   ├── http/
│   │   │   ├── routes/
│   ├── utils/
├── .babelrc
├── Dockerfile
├── .dockerignore
├── .gitignore
├── eslint.config.js
├── jest.config.js
├── jest.setup.js
├── nodemon.json
├── package.json
├── README.md
```

## Environment Variables

The following environment variables are required to configure the `rsc-evt-api-gateway-service`. These variables should be placed in a `.env.<environment>` files in the root directory of the project.

| Variable                    | Description                         | Example Value              |
| --------------------------- | ----------------------------------- | -------------------------- |
| `NODE_ENV`                  | Environment mode                    | `development`              |
| `APP_NAME`                  | Name of the application             | `rsc-evt`                  |
| `APP_SWAGGER_URL`           | API documentation route             | `api-docs`                 |
| `APP_HEALTH_URL`            | API health check route              | `health`                   |
| `SERVICE_PORT`              | Port on which the service will run  | `9000`                     |
| `SERVICE_NAME`              | Name of the service                 | `api-dateway-service`      |
| `SERVICE_PROTOCOL`          | Service protocol                    | `http`                     |
| `SERVICE_VERSION`           | Version of the service              | `1.0.0`                    |
| `SERVICE_HOST`              | Service hostname                    | `localhost`                |
| `SERVICE_ROUTE_PREFIX`      | Service route prefix                | `api/v1`                   |
| `CLIENT_PORT`               | Front end client port               | `5173`                     |
| `CLIENT_HOST`               | Client hostname                     | `localhost`                |
| `CLIENT_PROTOCOL`           | Client application protocol         | `http`                     |
| `SERVER_CERT_PATH`          | Path to the server certificate      | `C:\\Certs\\X509-cert.pem` |
| `AUTH_SERVICE_PORT`         | Authentication service port         | `9001`                     |
| `AUTH_SERVICE_NAME`         | Authentication service name         | `auth`                     |
| `AUTH_SERVICE_PROTOCOL`     | Authentication service protocol     | `http`                     |
| `AUTH_SERVICE_HOST`         | Authentication service hostname     | `localhost`                |
| `AUTH_SERVICE_ROUTE_PREFIX` | Authentication service route prefix | `api/v1/auth`              |
| `USER_SERVICE_PORT`         | user service port                   | `9002`                     |
| `USER_SERVICE_NAME`         | user service name                   | `user`                     |
| `USER_SERVICE_PROTOCOL`     | user service protocol               | `http`                     |
| `USER_SERVICE_HOST`         | user service hostname               | `localhost`                |
| `USER_SERVICE_ROUTE_PREFIX` | user service route prefix           | `api/v1/user`              |

### Example .env.development File

```dotenv
NODE_ENV=development

APP_NAME=booknow.lk
APP_SWAGGER_URL=api-docs
App_HEALTH_URL=health

SERVICE_PORT=9000
SERVICE_NAME=api-dateway-service
SERVICE_VERSION=1.0.0
SERVICE_PROTOCOL=http
SERVICE_HOST=localhost
SERVICE_ROUTE_PREFIX=api/v1

CLIENT_PORT=5173
CLIENT_HOST=localhost
CLIENT_PROTOCOL=http

SERVER_CERT_PATH=C:\\Certs\\X509-cert.pem

AUTH_SERVICE_PORT=9001
AUTH_SERVICE_NAME=auth
AUTH_SERVICE_PROTOCOL=http
AUTH_SERVICE_HOST=localhost
AUTH_SERVICE_ROUTE_PREFIX=api/v1/auth

USER_SERVICE_PORT=9002
USER_SERVICE_NAME=user
USER_SERVICE_PROTOCOL=http
USER_SERVICE_HOST=localhost
USER_SERVICE_ROUTE_PREFIX=api/v1/users

```

## Git Workflow

To maintain a clean and efficient development process, we use the following workflow involving our main branches: `production`, `testing`, and `master`.

### Main Branches

- **`master`**: The primary branch that always reflects a stable version of the project.
- **`testing`**: The branch used for testing new features and bug fixes before they are merged into `master`.
- **`production`**: The branch that reflects the live version of the project in production.

### Branch Workflow

1. **Developing New Features**
   - Create a new feature branch from `testing`.
   - Naming convention: `feature/{short-description}`
   - Example: `feature/user-registration`
   - Work on your feature in the newly created branch.
   - Once the feature is complete, thoroughly test it locally.

2. **Fixing Bugs**
   - Create a new bug fix branch from `testing`.
   - Naming convention: `bugfix/{short-description}`
   - Example: `bugfix/fix-login-error`
   - Fix the bug and test it locally.
   - Merge the bug fix branch into `testing`.

3. **Hotfixes**
   - Create a new hotfix branch from `production`.
   - Naming convention: `hotfix/{short-description}`
   - Example: `hotfix/patch-critical-bug`
   - Apply the critical fix and test it.
   - Merge the hotfix branch into both `production` and `master`.

4. **Testing**
   - Merge feature and bug fix branches into `testing` for integration testing.
   - Ensure all tests pass in the `testing` branch.
   - Perform any necessary quality assurance processes.

5. **Releasing to Production**
   - Once all features and fixes in `testing` are verified, merge `testing` into `master`.
   - After final verification on `master`, merge `master` into `production` for the release.
   - Deploy the `production` branch to the live environment.

### Example Commands

**Creating a New Feature Branch**

```bash
git checkout -b feature/user-registration testing
```

## Git Branching Naming Convention

To maintain a clean and manageable Git repository, we follow specific naming conventions for our branches:

- **Feature Branches:**
  - Naming convention: `feature/{short-description}`
  - Example: `feature/user-registration`

- **Bug Fix Branches:**
  - Naming convention: `bugfix/{short-description}`
  - Example: `bugfix/fix-login-error`

- **Hotfix Branches:**
  - Naming convention: `hotfix/{short-description}`
  - Example: `hotfix/patch-critical-bug`

- **Release Branches:**
  - Naming convention: `release/{version-number}`
  - Example: `release/1.0.0`

- **Documentation Branches:**
  - Naming convention: `doc/{short-description}`
  - Example: `doc/update-readme`

  **Note:** _Use only if altering documentation files not related to any Feature, Bugfix, Hotfix or Release implementation. Make sure to update `doc` branch from `master` before making changes._

## Documentation

The api documentation can be accessed via [API Documentation](http://localhost:9000/docs) after running auth service.

## Contributing

Contributions are welcome! Please read the [contributing guidelines](#contributing-guidelines) first.

## License

This project is licensed under the MIT License. See the [LICENSE](#license) file for more information.
