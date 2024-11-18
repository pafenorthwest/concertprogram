
# Download 
- Clone repository from git `git clone https://github.com/ericpassmore/concertprogram`
- Update `.env` file
   - `.env.example` to create `.env` file
   - change `admin` and `password`, these are your admin website credentials 

# Postgresql setup 
## Install Postgresql 
- Download following instructions on https://www.postgresql.org/download/
- Make new directory for logs 
- Update path to postgresql 
- Start following instructions on https://www.postgresql.org/docs/current/server-start.html

### For example on macos run
- `brew install postgresql@15`
- `mkdir -p ~/log/postgresql/`
- `export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"`
- `nohup postgres -D /opt/homebrew/var/postgresql@15 >~/log/postgresql/concert.log 2>&1 &`

## Create Database 
- login `psql postgres`
- run [database/init.sql](database/init.sql) found in this repo
  - remember to change the password 
  - you may not need to specify the `template` when creating the db 
- logout & log back in with your username and password `psql -U concertchair -d pafe -P`
- check the tables are there run `\dt` on the command line 

## Update ENV 
- If `.env` does not exist, copy the `.env.example` to create `.env` file
- In `.env` update the database connection information, default port is `5432`

# Application Setup
- Must have node and npm installed
  - Follow instructions for nodejs install `https://nodejs.org/en/download/package-manager`
- Install packages `npm install`
- Run Build `npm run build`
- To view website `npm run preview`

## Upload to Vercel 
Uploads are done via `vercel` command line. 
After completing these steps, the CLI will show the URL for the production instance.
- Download and Install `npm i -g vercel@latest`
- Run `vercel` and follow prompts to link and deploy 


