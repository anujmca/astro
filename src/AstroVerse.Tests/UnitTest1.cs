using AstroVerse.Api;
using Xunit;

namespace AstroVerse.Tests
{
    public class ConnectionStringParserTests
    {
        [Theory]
        [InlineData(null, null)]
        [InlineData("", "")]
        [InlineData("Data Source=astroverse.db", "Data Source=astroverse.db")]
        [InlineData("Host=localhost;Database=astro;Username=test;Password=test", "Host=localhost;Database=astro;Username=test;Password=test")]
        public void ConvertPostgresUriToConnectionString_ReturnsOriginal_WhenNotUri(string? input, string? expected)
        {
            var result = ConnectionStringParser.ConvertPostgresUriToConnectionString(input);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void ConvertPostgresUriToConnectionString_ParsesStandardPostgresUri()
        {
            var uri = "postgresql://user123:pwd456@ep-frosty-boat.neon.tech:5432/neondb?sslmode=require";
            var expected = "Host=ep-frosty-boat.neon.tech;Port=5432;Database=neondb;Username=user123;Password=pwd456;SSL Mode=Require;Trust Server Certificate=true;";
            
            var result = ConnectionStringParser.ConvertPostgresUriToConnectionString(uri);
            
            Assert.Equal(expected, result);
        }

        [Fact]
        public void ConvertPostgresUriToConnectionString_ParsesPostgresUriWithoutPortOrQuery()
        {
            var uri = "postgres://user123:pwd456@ep-frosty-boat.neon.tech/neondb";
            var expected = "Host=ep-frosty-boat.neon.tech;Port=5432;Database=neondb;Username=user123;Password=pwd456;SSL Mode=Require;Trust Server Certificate=true;";
            
            var result = ConnectionStringParser.ConvertPostgresUriToConnectionString(uri);
            
            Assert.Equal(expected, result);
        }

        [Fact]
        public void ConvertPostgresUriToConnectionString_UnescapesUrlEncodedCredentials()
        {
            var uri = "postgresql://user%40mail.com:pwd%23123@ep-frosty-boat.neon.tech/neondb%20space";
            var expected = "Host=ep-frosty-boat.neon.tech;Port=5432;Database=neondb space;Username=user@mail.com;Password=pwd#123;SSL Mode=Require;Trust Server Certificate=true;";
            
            var result = ConnectionStringParser.ConvertPostgresUriToConnectionString(uri);
            
            Assert.Equal(expected, result);
        }

        [Fact]
        public void ConvertPostgresUriToConnectionString_HandlesDifferentSslModes()
        {
            var uri = "postgres://user:pwd@host/db?sslmode=disable";
            var expected = "Host=host;Port=5432;Database=db;Username=user;Password=pwd;SSL Mode=Disable;Trust Server Certificate=true;";
            
            var result = ConnectionStringParser.ConvertPostgresUriToConnectionString(uri);
            
            Assert.Equal(expected, result);
        }
    }
}
