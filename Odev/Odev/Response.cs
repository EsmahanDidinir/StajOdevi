namespace Odev.Services
{
    public class Response<T>
    { //Response<T> sınıfı, API yanıtlarını ve servis yanıtlarını standart bir yapı ile düzenler,
      //hata yönetimini kolaylaştırır ve veri iletimi sırasında tutarlılık sağlar.
        public T Data { get; set; }
        public bool Success { get; set; }
        public string Message { get; set; }

        // Varsayılan yapılandırıcı
        public Response()
        {
            Success = true;
            Message = string.Empty;
        }

        // Başarılı yanıt oluşturmak için yapılandırıcı
        public Response(T data) : this()
        {
            Data = data;
        }

        // Hatalı yanıt oluşturmak için yapılandırıcı
        public Response(string message) : this()
        {
            Success = false;
            Message = message;
        }

        // Tam yanıt oluşturmak için yapılandırıcı
        public Response(T data, bool success, string message)
        {
            Data = data;
            Success = success;
            Message = message;
        }
    }
}
