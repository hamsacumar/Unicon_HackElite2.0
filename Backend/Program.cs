using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Backend.Settings;
using Backend.Models;
using Backend.Services;
using Microsoft.OpenApi.Models;


var builder = WebApplication.CreateBuilder(args);

//
//  Load settings from appsettings.json (MongoDB, JWT, Email, GoogleAuth)
//
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDbSettings"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.Configure<GoogleAuthSettings>(builder.Configuration.GetSection("GoogleAuth"));

//
//  MongoDB Client registration (Singleton)
//
builder.Services.AddSingleton<IMongoClient>(s =>
{
    var settings = s.GetRequiredService<IOptions<MongoDbSettings>>().Value;
    return new MongoClient(settings.ConnectionString);
});

//
//  Load strongly typed settings (optional use later)
//
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>()!;
var emailSettings = builder.Configuration.GetSection("EmailSettings").Get<EmailSettings>()!;
var googleAuthSettings = builder.Configuration.GetSection("GoogleAuth").Get<GoogleAuthSettings>()!;

//
//  Authentication: JWT + Google
//
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer(options =>
    {
        var jwt = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
        options.TokenValidationParameters = new Microsoft.IdentityModel.Tokens.TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt?.Issuer,
            ValidAudience = jwt?.Audience,
            IssuerSigningKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
                System.Text.Encoding.UTF8.GetBytes(jwt?.Key ?? "")),
            NameClaimType = "name",
            RoleClaimType = "role"
        };
        
        //  Map JWT claims to standard claim types
        options.MapInboundClaims = true;
    })
    .AddGoogle(options =>
    {
        options.ClientId = googleAuthSettings.ClientId;
        options.ClientSecret = googleAuthSettings.ClientSecret;
        options.CallbackPath = "/signin-google"; // Google OAuth callback
    });

// ----------------------------
// Authorization Policies
// ----------------------------
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("OrganizationOnly", policy =>
        policy.RequireRole("Organizer"));
});

// ----------------------------
// Controllers & Swagger
// ----------------------------
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Backend API", Version = "v1" });

    //  JWT Authentication in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] + token. Example: `Bearer eyJhbGciOi...`"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] {}
        }
    });

    //  Enable file uploads in Swagger if needed
    c.OperationFilter<FileUploadOperationFilter>();
});

//
//  Dependency Injection (Services)
//
builder.Services.AddScoped<ITestService, TestService>();
builder.Services.AddScoped<IUserService, UserService>(); // use Scoped (preferred for DB ops)
builder.Services.AddSingleton<IEmailService, EmailService>();
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddSingleton<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddScoped<ITokenCheckService, TokenCheckService>();
builder.Services.AddScoped<InputService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ProfileDetailService>();

//
//  CORS Policy (Allow All)
//
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

//
//  Build App
//
var app = builder.Build();

//
//  Swagger (only in Development)
//
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Static files (images)
app.UseStaticFiles();

// Enable CORS, Authentication & Authorization
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

//
//  Map API Controllers
//
app.MapControllers();

// ----------------------------
// Run the application
// ----------------------------
app.Run();