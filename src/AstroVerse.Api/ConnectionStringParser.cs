using System;

namespace AstroVerse.Api
{
    public static class ConnectionStringParser
    {
        public static string? ConvertPostgresUriToConnectionString(string? uriString)
        {
            if (string.IsNullOrEmpty(uriString))
                return uriString;

            if (!uriString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) &&
                !uriString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            {
                return uriString;
            }

            try
            {
                var uri = new Uri(uriString);
                var userInfo = uri.UserInfo.Split(':');
                var username = Uri.UnescapeDataString(userInfo[0]);
                var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
                var host = uri.Host;
                var port = uri.Port > 0 ? uri.Port : 5432;
                var database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'));

                var connStr = $"Host={host};Port={port};Database={database};Username={username};Password={password};";

                var sslMode = "Require";
                if (!string.IsNullOrEmpty(uri.Query))
                {
                    var query = uri.Query.TrimStart('?');
                    var pairs = query.Split('&');
                    foreach (var pair in pairs)
                    {
                        var kvp = pair.Split('=');
                        if (kvp.Length == 2 && kvp[0].Equals("sslmode", StringComparison.OrdinalIgnoreCase))
                        {
                            var val = kvp[1];
                            if (val.Equals("require", StringComparison.OrdinalIgnoreCase)) sslMode = "Require";
                            else if (val.Equals("disable", StringComparison.OrdinalIgnoreCase)) sslMode = "Disable";
                            else if (val.Equals("allow", StringComparison.OrdinalIgnoreCase)) sslMode = "Allow";
                            else if (val.Equals("prefer", StringComparison.OrdinalIgnoreCase)) sslMode = "Prefer";
                            else if (val.Equals("verify-ca", StringComparison.OrdinalIgnoreCase)) sslMode = "VerifyCA";
                            else if (val.Equals("verify-full", StringComparison.OrdinalIgnoreCase)) sslMode = "VerifyFull";
                        }
                    }
                }

                connStr += $"SSL Mode={sslMode};Trust Server Certificate=true;";
                return connStr;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[DB SETUP] Failed to convert database URI to ADO.NET connection string: {ex.Message}");
                return uriString;
            }
        }
    }
}
