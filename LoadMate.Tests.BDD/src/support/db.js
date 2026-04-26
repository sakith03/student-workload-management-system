const sql = require("mssql");
const { config } = require("./env");

function requireDbPassword() {
  if (!config.dbPassword) {
    throw new Error(
      "Missing DB password. Set E2E_DB_PASSWORD or DB_PASSWORD in environment."
    );
  }
}

async function withPool(fn) {
  requireDbPassword();
  const pool = await sql.connect({
    server: config.dbServer,
    port: config.dbPort,
    user: config.dbUser,
    password: config.dbPassword,
    database: config.dbName,
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  });

  try {
    return await fn(pool);
  } finally {
    await pool.close();
  }
}

async function getLatestPendingInvitationTokenByEmail(invitedEmail) {
  return await withPool(async (pool) => {
    const result = await pool
      .request()
      .input("email", sql.NVarChar(255), String(invitedEmail).trim().toLowerCase())
      .query(`
        SELECT TOP 1 Token
        FROM GroupInvitations
        WHERE InvitedEmail = @email AND Status = 1
        ORDER BY CreatedAt DESC
      `);

    const row = result.recordset?.[0];
    return row?.Token;
  });
}

module.exports = {
  getLatestPendingInvitationTokenByEmail,
};

