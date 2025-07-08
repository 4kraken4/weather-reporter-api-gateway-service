/* eslint-disable no-undef */
import { expect, jest } from '@jest/globals'
import Config from '../../src/config/Config.js'
import weatherController from '../../src/controller/weatherController.js'
import WeatherProxy from '../../src/infrastructure/proxies/WeatherProxy.js'
import { getCircuitBreakerInstance } from '../../src/utils/CircuiteBreaker.js'

jest.mock('../../src/infrastructure/proxies/WeatherProxy.js.js')
jest.mock('../../src/utils/CircuiteBreaker.js')

describe('weatherController', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('search', () => {
    it('should successfully search for weather data', async () => {
      const mockReq = {
        query: { q: 'London', page: '1', pageSize: '5' }
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const mockNext = jest.fn()

      const mockWeatherData = {
        locations: [
          { id: 1, name: 'London', temp: 15 },
          { id: 2, name: 'London City', temp: 14 }
        ],
        total: 2
      }

      const mockBreaker = {
        fire: jest.fn().mockResolvedValue(mockWeatherData)
      }

      getCircuitBreakerInstance.mockReturnValue(mockBreaker)

      await weatherController.search(mockReq, mockRes, mockNext)

      expect(getCircuitBreakerInstance).toHaveBeenCalledWith(
        WeatherProxy.search,
        Config.getInstance().services.weather.name
      )
      expect(mockBreaker.fire).toHaveBeenCalledWith(mockReq)
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockWeatherData)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle search errors', async () => {
      const mockReq = {
        query: { q: 'InvalidLocation' }
      }
      const mockRes = {}
      const mockNext = jest.fn()
      const mockError = new Error('Search failed')

      const mockBreaker = {
        fire: jest.fn().mockRejectedValue(mockError)
      }

      getCircuitBreakerInstance.mockReturnValue(mockBreaker)

      await weatherController.search(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(mockError)
    })
  })

  describe('getWeatherByCity', () => {
    it('should successfully get weather by city ID', async () => {
      const mockReq = {
        params: { id: '12345' },
        query: { units: 'metric' }
      }
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      }
      const mockNext = jest.fn()

      const mockWeatherData = {
        id: 12345,
        name: 'London',
        temp: 15,
        conditions: 'Cloudy'
      }

      const mockBreaker = {
        fire: jest.fn().mockResolvedValue(mockWeatherData)
      }

      getCircuitBreakerInstance.mockReturnValue(mockBreaker)

      await weatherController.getWeatherByCity(mockReq, mockRes, mockNext)

      expect(getCircuitBreakerInstance).toHaveBeenCalledWith(
        WeatherProxy.getWeatherByCity,
        Config.getInstance().services.weather.name
      )
      expect(mockBreaker.fire).toHaveBeenCalledWith(mockReq)
      expect(mockRes.status).toHaveBeenCalledWith(200)
      expect(mockRes.json).toHaveBeenCalledWith(mockWeatherData)
      expect(mockNext).not.toHaveBeenCalled()
    })

    it('should handle errors when getting weather by city', async () => {
      const mockReq = {
        params: { id: '99999' } // Non-existent city
      }
      const mockRes = {}
      const mockNext = jest.fn()
      const mockError = new Error('City not found')

      const mockBreaker = {
        fire: jest.fn().mockRejectedValue(mockError)
      }

      getCircuitBreakerInstance.mockReturnValue(mockBreaker)

      await weatherController.getWeatherByCity(mockReq, mockRes, mockNext)

      expect(mockNext).toHaveBeenCalledWith(mockError)
    })

    it('should log errors when getting weather by city', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

      const mockReq = {
        params: { id: '99999' }
      }
      const mockRes = {}
      const mockNext = jest.fn()
      const mockError = new Error('Server error')

      const mockBreaker = {
        fire: jest.fn().mockRejectedValue(mockError)
      }

      getCircuitBreakerInstance.mockReturnValue(mockBreaker)

      await weatherController.getWeatherByCity(mockReq, mockRes, mockNext)

      expect(consoleSpy).toHaveBeenCalledWith('Error in /current/:id:', mockError)
      consoleSpy.mockRestore()
    })
  })
})
