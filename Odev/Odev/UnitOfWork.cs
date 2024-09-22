using System;
using System.Threading.Tasks;
using Odev.Models;
using Odev.Data;

namespace Odev.Data
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _context; // Veritabanı ile etkileşim için kullanılan DbContext nesnesidir.
        private IRepository<GeometryData> _geometries; // GeometryData veri işlemleri için kullanılan repository

        public UnitOfWork(ApplicationDbContext context)
        {
            _context = context;
        }

        public IRepository<GeometryData> Geometries
        {
            get
            {
                return _geometries ??= new Repository<GeometryData>(_context);
            }
        }

        public async Task<int> CommitAsync() // Yapılan değişiklikleri veritabanına kaydeder.
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose() // ApplicationDbContext'i serbest bırakır ve kaynakları temizler.
        {
            _context.Dispose();
        }
    }
}
