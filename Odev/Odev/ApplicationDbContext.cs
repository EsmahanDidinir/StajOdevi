using Microsoft.EntityFrameworkCore;
using Odev.Models;

namespace Odev.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        { }

        // GeometryData modeli için DbSet
        public DbSet<GeometryData> Geometries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // GeometryData tablosu için yapılandırma
            modelBuilder.Entity<GeometryData>()
                .ToTable("geometries") // Tablonun adı 'geometries'
                .HasKey(g => g.Id);    // 'Id' anahtar kolon olarak ayarlanır

            modelBuilder.Entity<GeometryData>()
                .Property(g => g.Id).HasColumnName("id"); // Id kolon adı 'id' olur

            modelBuilder.Entity<GeometryData>()
               .Property(g => g.Name).HasColumnName("name"); // Name kolon adı 'name'

            modelBuilder.Entity<GeometryData>()
                .Property(g => g.Geometry).HasColumnName("wkt"); // Geometrik veriler WKT formatında string olarak saklanacak
        }
    }
}
