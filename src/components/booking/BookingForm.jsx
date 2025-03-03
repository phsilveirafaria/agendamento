 
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useAuth } from '../../contexts/AuthContext';

export default function BookingForm({
  rooms,
  selectedRoom,
  slot,
  event,
  onSubmit,
  onDelete,
  onCancel,
  isAdmin
}) {
  const { user } = useAuth();
  const [booking, setBooking] = useState({
    id: event?.id || null,
    title: event?.title || '',
    start: event?.start || slot?.start || new Date(),
    end: event?.end || slot?.end || new Date(new Date().setHours(new Date().getHours() + 1)),
    roomId: event?.roomId || selectedRoom || (rooms[0]?.id || ''),
    notes: event?.notes || ''
  });

  useEffect(() => {
    // Atualizar roomId quando selectedRoom mudar
    if (selectedRoom && !event) {
      setBooking(prev => ({ ...prev, roomId: selectedRoom }));
    }
  }, [selectedRoom, event]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBooking(prev => ({ ...prev, [name]: value }));
  };

  const handleStartChange = (date) => {
    // Garantir que a data de término seja pelo menos 30 minutos após o início
    const endDate = new Date(date);
    endDate.setMinutes(endDate.getMinutes() + 30);
    
    if (endDate > booking.end) {
      setBooking(prev => ({ ...prev, start: date, end: endDate }));
    } else {
      setBooking(prev => ({ ...prev, start: date }));
    }
  };

  const handleEndChange = (date) => {
    setBooking(prev => ({ ...prev, end: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações básicas
    if (!booking.title.trim()) {
      alert('Por favor, informe um título para o agendamento.');
      return;
    }
    
    if (!booking.roomId) {
      alert('Por favor, selecione uma sala.');
      return;
    }
    
    // Validar duração (mínimo 30 minutos, máximo 4 horas)
    const durationMs = booking.end - booking.start;
    const durationMinutes = durationMs / (1000 * 60);
    
    if (durationMinutes < 30) {
      alert('Agendamentos devem ter duração mínima de 30 minutos.');
      return;
    }
    
    if (durationMinutes > 240) {
      alert('Agendamentos devem ter duração máxima de 4 horas.');
      return;
    }
    
    // Enviar para o pai
    const success = await onSubmit(booking);
    
    if (success) {
      onCancel();
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
      const success = await onDelete(booking.id);
      if (success) {
        onCancel();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">
          {event ? 'Editar Agendamento' : 'Novo Agendamento'}
        </h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Título</label>
            <input
              type="text"
              name="title"
              value={booking.title}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Sala</label>
            <select
              name="roomId"
              value={booking.roomId}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Selecione uma sala</option>
              {rooms.map(room => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Data e Hora de Início</label>
              <DatePicker
                selected={booking.start}
                onChange={handleStartChange}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                minDate={new Date()}
                minTime={new Date().setHours(8, 0)}
                maxTime={new Date().setHours(17, 30)}
                filterTime={(time) => {
                  // Permitir apenas horários entre 8h e 17:30
                  const hours = new Date(time).getHours();
                  return hours >= 8 && hours < 18;
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Data e Hora de Término</label>
              <DatePicker
                selected={booking.end}
                onChange={handleEndChange}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                dateFormat="dd/MM/yyyy HH:mm"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                minDate={new Date(booking.start)}
                minTime={new Date(booking.start).getTime() + 30 * 60 * 1000}
                maxTime={new Date().setHours(18, 0)}
                filterTime={(time) => {
                  // Não permitir horários antes do início + 30min
                  const minEndTime = new Date(booking.start);
                  minEndTime.setMinutes(minEndTime.getMinutes() + 30);
                  
                  // Não permitir horários após 18h
                  const maxEndTime = new Date(booking.start);
                  maxEndTime.setHours(18, 0, 0, 0);
                  
                  return time >= minEndTime && time <= maxEndTime;
                }}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea
              name="notes"
              value={booking.notes}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows="3"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-2">
            {event && (isAdmin || event.userId === user?.id) && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Excluir
              </button>
            )}
            
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}