using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Linq;
using System.Reflection;

namespace Backend.Filters
{
    public class EventFileUploadFilter : IOperationFilter
    {
        public void Apply(OpenApiOperation operation, OperationFilterContext context)
        {
            var methodInfo = context.MethodInfo;
            var parameters = methodInfo.GetParameters();

            // Check if any parameter has [FromForm]
            var fromFormParam = parameters.FirstOrDefault(p =>
                p.GetCustomAttribute<Microsoft.AspNetCore.Mvc.FromFormAttribute>() != null);

            if (fromFormParam == null) return;

            var schemaProps = fromFormParam.ParameterType.GetProperties()
                .ToDictionary(
                    prop => prop.Name,
                    prop =>
                    {
                        var type = prop.PropertyType;
                        if (type == typeof(Microsoft.AspNetCore.Http.IFormFile))
                            return new OpenApiSchema { Type = "string", Format = "binary" };
                        if (type == typeof(DateTime) || type == typeof(DateTime?))
                            return new OpenApiSchema { Type = "string", Format = "date-time" };
                        return new OpenApiSchema { Type = "string" };
                    });

            operation.RequestBody = new OpenApiRequestBody
            {
                Content =
                {
                    ["multipart/form-data"] = new OpenApiMediaType
                    {
                        Schema = new OpenApiSchema
                        {
                            Type = "object",
                            Properties = schemaProps,
                            Required = schemaProps.Keys
                                .Where(k => fromFormParam.ParameterType
                                    .GetProperty(k)
                                    ?.PropertyType.IsValueType ?? false)
                                .ToHashSet()
                        }
                    }
                }
            };
        }
    }
}
