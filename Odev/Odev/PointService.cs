using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Odev.Models;
using Odev.Data;

namespace Odev.Services
{
    public class GeometryService
    {
        private readonly IUnitOfWork _unitOfWork;

        public GeometryService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<Response<List<GeometryData>>> GetAllAsync()
        {
            try
            {
                var entities = (await _unitOfWork.Geometries.GetAllAsync()).ToList();
                return new Response<List<GeometryData>>(entities);
            }
            catch (Exception ex)
            {
                return new Response<List<GeometryData>>(null, false, ex.Message);
            }
        }

        public async Task<Response<GeometryData>> GetByIdAsync(long id)
        {
            try
            {
                var entity = await _unitOfWork.Geometries.GetByIdAsync(id);
                if (entity == null)
                {
                    return new Response<GeometryData>(null, false, "Geometry not found");
                }
                return new Response<GeometryData>(entity);
            }
            catch (Exception ex)
            {
                return new Response<GeometryData>(null, false, ex.Message);
            }
        }

        public async Task<Response<GeometryData>> AddAsync(GeometryData geometry)
        {
            try
            {
                var existingEntity = await _unitOfWork.Geometries.GetByIdAsync(geometry.Id);
                if (existingEntity != null)
                {
                    return new Response<GeometryData>("Geometry with the same ID already exists");
                }

                await _unitOfWork.Geometries.AddAsync(geometry);
                await _unitOfWork.CommitAsync();
                return new Response<GeometryData>(geometry);
            }
            catch (Exception ex)
            {
                return new Response<GeometryData>(null, false, ex.Message);
            }
        }

        public async Task<Response<GeometryData>> UpdateAsync(long id, GeometryData geometry)
        {
            try
            {
                var existingEntity = await _unitOfWork.Geometries.GetByIdAsync(id);
                if (existingEntity == null)
                {
                    return new Response<GeometryData>(null, false, "Geometry not found");
                }

                // Update properties
                existingEntity.Geometry = geometry.Geometry;
                existingEntity.Name = geometry.Name;

                await _unitOfWork.Geometries.UpdateAsync(existingEntity);
                await _unitOfWork.CommitAsync();
                return new Response<GeometryData>(existingEntity);
            }
            catch (Exception ex)
            {
                return new Response<GeometryData>(null, false, ex.Message);
            }
        }

        public async Task<Response<bool>> DeleteAsync(long id)
        {
            try
            {
                var existingEntity = await _unitOfWork.Geometries.GetByIdAsync(id);
                if (existingEntity == null)
                {
                    return new Response<bool>(false, false, "Geometry not found");
                }

                await _unitOfWork.Geometries.DeleteAsync(id);
                await _unitOfWork.CommitAsync();
                return new Response<bool>(true);
            }
            catch (Exception ex)
            {
                return new Response<bool>(false, false, ex.Message);
            }
        }
    }
}
