import { useEffect, useState, useCallback } from 'react'
import Select from 'react-select'
import { useField, useFormikContext } from 'formik'
import axios from 'axios'
import debounce from 'lodash.debounce'

const SegmentosSelect = ({ name }) => {
  const { setFieldValue } = useFormikContext()
  const [field] = useField(name)
  const [options, setOptions] = useState([])

  const baseUrl = import.meta.env.VITE_API_BASE_URL

  const fetchSegmentos = async (search = '') => {
    try {
      const { data } = await axios.get(`${baseUrl}/v1/segmentos?q=${search}`)
      const mapped = data.map(seg => ({ label: seg.nome, value: seg.id }))
      setOptions(mapped)
    } catch (error) {
      console.error('Erro ao carregar segmentos', error)
    }
  }

  // ⚡ Debounce para reduzir requisições
  const debouncedFetch = useCallback(
    debounce((inputValue) => {
      fetchSegmentos(inputValue)
    }, 300),
    []
  )

  useEffect(() => {
    fetchSegmentos()
  }, [])

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">Segmentos</label>
      <Select
        isMulti
        name={name}
        options={options}
        value={options.filter(opt => field.value?.includes(opt.value))}
        onChange={(selected) => setFieldValue(name, selected.map(opt => opt.value))}
        onInputChange={(inputValue) => {
          debouncedFetch(inputValue || "")
          return inputValue // 👈 importante para evitar erro do [object Promise]
        }}
        placeholder="Digite para buscar e selecione..."
        classNamePrefix="react-select"
      />
    </div>
  )
}

export default SegmentosSelect
