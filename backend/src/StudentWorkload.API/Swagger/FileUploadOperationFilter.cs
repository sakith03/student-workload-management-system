namespace StudentWorkload.API.Swagger;

using Microsoft.AspNetCore.Http;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

/// <summary>
/// Enables Swagger generation for actions that accept file uploads via [FromForm] IFormFile.
/// Without this, Swashbuckle throws and the entire /swagger/v1/swagger.json returns 500.
/// </summary>
public sealed class FileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasFileUpload = context.ApiDescription.ParameterDescriptions.Any(p =>
            p.Type == typeof(IFormFile) ||
            typeof(IFormFile).IsAssignableFrom(p.Type));

        if (!hasFileUpload) return;

        operation.RequestBody = new OpenApiRequestBody
        {
            Required = true,
            Content =
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties =
                        {
                            ["file"] = new OpenApiSchema
                            {
                                Type = "string",
                                Format = "binary"
                            }
                        },
                        Required = new HashSet<string> { "file" }
                    }
                }
            }
        };
    }
}

