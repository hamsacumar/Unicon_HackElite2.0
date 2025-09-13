using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using Backend.Settings;
using Backend.Models;
using Backend.Services;
using Microsoft.OpenApi.Models;
using Backend.Filters;
using Hackelite2._0.Hubs;

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
            RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
        };
        options.MapInboundClaims = true;
    })
    .AddGoogle(options =>
    {
        options.ClientId = googleAuthSettings.ClientId;
        options.ClientSecret = googleAuthSettings.ClientSecret;
        options.CallbackPath = "/signin-google";
    });

//
//  Authorization Policies
//
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("OrganizationOnly", policy =>
        policy.RequireRole("Organizer"));
    
    // Add a default policy that will be used by [Authorize] attribute
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .AddAuthenticationSchemes("Bearer")
        .RequireAuthenticatedUser()
        .Build();
});

//
//  Controllers & JSON Options
//
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

//
//  Swagger
//
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Backend API", Version = "v1" });

    // JWT in Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] + token"
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

    c.OperationFilter<FileUploadOperationFilter>();
    c.OperationFilter<SwaggerFileOperationFilter>();
});

//
//  Dependency Injection (Services)
//
builder.Services.AddScoped<ITestService, TestService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton<IEmailService, EmailService>();
builder.Services.AddSingleton<IJwtService, JwtService>();
builder.Services.AddSingleton<IGoogleAuthService, GoogleAuthService>();
builder.Services.AddScoped<ITokenCheckService, TokenCheckService>();
builder.Services.AddScoped<InputService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddScoped<IPostService, PostService>();
builder.Services.AddScoped<ProfileDetailService>();
builder.Services.AddScoped<INotificationService, NotificationService>();

//
//  SignalR
//
builder.Services.AddSignalR();

//
//  CORS Policy
//
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyHeader().AllowAnyMethod().AllowCredentials().SetIsOriginAllowed(_ => true);
    });
});

//
//  Build App
//
var app = builder.Build();

//
//  Swagger (Dev Only)
//
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
// Static files (images)
app.UseStaticFiles(); 


// ✅ Enable CORS before Authorization
app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

//
//  Map API Controllers & SignalR Hubs
//
app.MapControllers();
app.MapHub<NotificationHub>("/notificationHub");

//
//  Run
//
app.Run();
