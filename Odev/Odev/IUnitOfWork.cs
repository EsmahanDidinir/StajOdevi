using System;
using System.Threading.Tasks;
using Odev.Models;

namespace Odev.Data
{
    public interface IUnitOfWork : IDisposable
    {
        IRepository<GeometryData> Geometries { get; } // GeometryData nesneleriyle veri işlemleri yapabilen repository sağlar.
        Task<int> CommitAsync(); // Yapılan değişiklikleri veritabanına kaydeder.
    }
}
