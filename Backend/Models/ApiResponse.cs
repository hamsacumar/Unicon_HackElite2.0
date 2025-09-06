namespace Backend.Models
{
    /// <summary>
    /// Standard API response format
    /// </summary>
    /// <typeparam name="T">Type of the data being returned</typeparam>
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }

        public ApiResponse(bool success, string? message, T? data)
        {
            Success = success;
            Message = message;
            Data = data;
        }
    }

    /// <summary>
    /// Non-generic version for responses without data
    /// </summary>
    public class ApiResponse : ApiResponse<object>
    {
        public ApiResponse(bool success, string? message, object? data = null) 
            : base(success, message, data)
        {
        }
    }
}
