using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Odev.Models;
using Odev.Services;

namespace Odev.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class GeometriesController : ControllerBase
    {
        private readonly GeometryService _geometryService;

        public GeometriesController(GeometryService geometryService)
        {
            _geometryService = geometryService;
        }

        // GET: api/geometries
        [HttpGet]
        public async Task<Response<List<GeometryData>>> GetAll()
        {
            var response = await _geometryService.GetAllAsync();
            return response;
        }

        // GET: api/geometries/{id}
        [HttpGet("{id}")]
        public async Task<Response<GeometryData>> GetById(long id)
        {
            var response = await _geometryService.GetByIdAsync(id);
            return response;
        }

        // POST: api/geometries
        [HttpPost]
        public async Task<Response<GeometryData>> Add(GeometryData geometry)
        {
            if (geometry == null)
            {
                return new Response<GeometryData>("Geometry cannot be null");
            }

            var response = await _geometryService.AddAsync(geometry);
            return response;
        }

        // PUT: api/geometries/{id}
        [HttpPut("{id}")]
        public async Task<Response<GeometryData>> Update(long id, GeometryData geometry)
        {
            if (geometry == null)
            {
                return new Response<GeometryData>("Geometry data is null");
            }

            if (id != geometry.Id)
            {
                return new Response<GeometryData>("ID mismatch between URL and body");
            }

            var response = await _geometryService.UpdateAsync(id, geometry);
            return response;
        }

        // DELETE: api/geometries/{id}
        [HttpDelete("{id}")]
        public async Task<Response<bool>> Delete(long id)
        {
            var response = await _geometryService.DeleteAsync(id);
            return response;
        }
    }
}
