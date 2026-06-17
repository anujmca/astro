using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using AstroVerse.Core.Interfaces;
using AstroVerse.Core.Services;
using AstroVerse.Infrastructure.Data;
using AstroVerse.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// --- 1. Database Configuration ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrEmpty(connectionString))
{
    // Fallback to SQLite in workspace for immediate portability
    var dbPath = Path.Combine(AppContext.BaseDirectory, "astroverse.db");
    connectionString = $"Data Source={dbPath}";
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlite(connectionString));
    Console.WriteLine($"[DB SETUP] No connection string provided. Using SQLite fallback: {dbPath}");
}
else
{
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseNpgsql(connectionString));
    Console.WriteLine("[DB SETUP] Using configured PostgreSQL Connection String.");
}

// --- 2. Caching Strategy ---
var redisConnectionString = builder.Configuration["Redis:ConnectionString"];
if (!string.IsNullOrEmpty(redisConnectionString))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConnectionString;
        options.InstanceName = "AstroVerse_";
    });
    Console.WriteLine("[CACHE SETUP] Using Redis caching layer.");
}
else
{
    builder.Services.AddDistributedMemoryCache();
    Console.WriteLine("[CACHE SETUP] Using Distributed Memory Cache fallback.");
}

// --- 3. Authentication & Authorization ---
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "AstroVerseSuperSecretLongJWTKey1234567890!";
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "AstroVerse",
        ValidAudience = builder.Configuration["Jwt:Audience"] ?? "AstroVerseUsers",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret))
    };
});

builder.Services.AddAuthorization();

// --- 4. Dependency Injection ---
builder.Services.AddScoped<IAstrologyService, AstrologyService>();
builder.Services.AddScoped<ITranslationService, TranslationService>();
builder.Services.AddScoped<IAiAssistantService, AiAssistantService>();
builder.Services.AddScoped<ITokenService, TokenService>();

// --- 5. CORS policy ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = builder.Configuration["Cors:AllowedOrigins"];
        if (!string.IsNullOrEmpty(allowedOrigins))
        {
            var origins = allowedOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries);
            policy.WithOrigins(origins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
        else
        {
            policy.SetIsOriginAllowed(origin => true)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        }
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddEndpointsApiExplorer();

// --- 6. Swagger Settings ---
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AstroVerse API", Version = "v1" });
    
    // Add Bearer Token Auth to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// --- 7. Auto Seeder & Migrations ---
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        DatabaseSeeder.Seed(context);
        Console.WriteLine("[DB SEED] Seeding completed successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DB ERROR] Error occurred while seeding database: {ex.Message}");
    }
}

// --- 8. Middlewares Pipeline ---
if (app.Environment.IsDevelopment() || true) // Enable Swagger globally for demonstration/review
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "AstroVerse API v1");
    });
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
