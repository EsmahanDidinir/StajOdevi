using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Odev.Data
{
    public interface IRepository<T> where T : class
    {
        Task<IEnumerable<T>> GetAllAsync();
        Task<T> GetByIdAsync(long id);
        Task AddAsync(T entity);
        Task UpdateAsync(T entity);
        Task DeleteAsync(long id);
        Task<IEnumerable<T>> FindAsync(Func<T, bool> predicate);
    }
}
