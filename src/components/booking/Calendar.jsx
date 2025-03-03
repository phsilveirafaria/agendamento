// src/components/booking/Calendar.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import moment from 'moment';
import 'moment/locale/pt-br';
import supabase from '../../hooks/useSupabase';
import { useAuth } from '../../contexts/AuthContext';
import BookingForm from './BookingForm';

moment.locale('pt-br');
const localizer = momentLocalizer(moment);

export default function BookingCalendar() {
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const { user, isAdmin } = useAuth();

  // Carregar salas
  useEffect(() => {
    async function fetchRooms() {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name');
      
      if (data) {
        setRooms(data);
        if (data.length > 0) {
          setSelectedRoom(data[0].id);
        }
      }
    }
    
    fetchRooms();
  }, []);

  // Carregar agendamentos
  useEffect(() => {
    async function fetchBookings() {
      let query = supabase
        .from('bookings')
        .select(`
          id,
          title,
          start_time,
          end_time,
          room_id,
          user_id,
          rooms(name, color),
          profiles(name)
        `);
      
      // Se não for admin, mostrar apenas agendamentos do usuário
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }
      
      const { data, error } = await query;
      
      if (data) {
        const formattedBookings = data.map(booking => ({
          id: booking.id,
          title: booking.title,
          start: new Date(booking.start_time),
          end: new Date(booking.end_time),
          roomId: booking.room_id,
          userId: booking.user_id,
          roomName: booking.rooms.name,
          roomColor: booking.rooms.color,
          userName: booking.profiles.name
        }));
        
        setBookings(formattedBookings);
      }
    }
    
    if (user) {
      fetchBookings();
    }
  }, [user, isAdmin]);

  // Filtrar agendamentos pela sala selecionada ou mostrar todos se for admin
  const filteredBookings = selectedRoom 
    ? bookings.filter(booking => booking.roomId === selectedRoom)
    : bookings;

  // Função para verificar conflitos de horário
  const checkTimeConflict = (start, end, roomId, bookingId = null) => {
    return bookings.some(booking => {
      // Ignorar o próprio agendamento em caso de edição
      if (bookingId && booking.id === bookingId) return false;
      
      // Verificar apenas conflitos na mesma sala
      if (booking.roomId !== roomId) return false;
      
      // Verificar sobreposição de horários
      return (
        (start >= booking.start && start < booking.end) ||
        (end > booking.start && end <= booking.end) ||
        (start <= booking.start && end >= booking.end)
      );
    });
  };

  // Lidar com a seleção de um slot de horário
  const handleSelectSlot = ({ start, end }) => {
    // Verificar se está fora do horário comercial (8h às 18h)
    const startHour = start.getHours();
    const endHour = end.getHours();
    
    if (startHour < 8 || startHour >= 18 || endHour < 8 || endHour > 18) {
      alert('Agendamentos só podem ser feitos entre 8h e 18h.');
      return;
    }
    
    // Verificar se é para uma data futura
    if (start < new Date()) {
      alert('Não é possível agendar para datas passadas.');
      return;
    }
    
    setSelectedSlot({ start, end });
    setSelectedEvent(null);
    setShowBookingForm(true);
  };

  // Lidar com a seleção de um evento existente
  const handleSelectEvent = (event) => {
    // Verificar permissões: admin pode editar qualquer evento, usuários apenas os seus
    if (isAdmin || event.userId === user.id) {
      setSelectedEvent(event);
      setSelectedSlot(null);
      setShowBookingForm(true);
    } else {
      alert('Você não tem permissão para editar este agendamento.');
    }
  };

  // Adicionar novo agendamento
  const handleAddBooking = async (bookingData) => {
    try {
      // Verificar conflitos
      if (checkTimeConflict(bookingData.start, bookingData.end, bookingData.roomId)) {
        alert('Já existe um agendamento neste horário para esta sala.');
        return false;
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            title: bookingData.title,
            start_time: bookingData.start.toISOString(),
            end_time: bookingData.end.toISOString(),
            room_id: bookingData.roomId,
            user_id: user.id,
            notes: bookingData.notes || ''
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Recarregar agendamentos
      const { data: room } = await supabase
        .from('rooms')
        .select('name, color')
        .eq('id', bookingData.roomId)
        .single();
        
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single();
      
      const newBooking = {
        id: data[0].id,
        title: bookingData.title,
        start: bookingData.start,
        end: bookingData.end,
        roomId: bookingData.roomId,
        userId: user.id,
        roomName: room.name,
        roomColor: room.color,
        userName: profile.name
      };
      
      setBookings([...bookings, newBooking]);
      setShowBookingForm(false);
      return true;
    } catch (error) {
      console.error('Erro ao adicionar agendamento:', error);
      alert('Erro ao adicionar agendamento. Tente novamente.');
      return false;
    }
  };

  // Atualizar agendamento existente
  const handleUpdateBooking = async (bookingData) => {
    try {
      // Verificar conflitos (ignorando o próprio agendamento)
      if (checkTimeConflict(
        bookingData.start, 
        bookingData.end, 
        bookingData.roomId, 
        bookingData.id
      )) {
        alert('Já existe um agendamento neste horário para esta sala.');
        return false;
      }
      
      const { error } = await supabase
        .from('bookings')
        .update({
          title: bookingData.title,
          start_time: bookingData.start.toISOString(),
          end_time: bookingData.end.toISOString(),
          room_id: bookingData.roomId,
          notes: bookingData.notes || ''
        })
        .eq('id', bookingData.id);
      
      if (error) throw error;
      
      // Atualizar lista de agendamentos
      setBookings(bookings.map(booking => 
        booking.id === bookingData.id
          ? {
              ...booking,
              title: bookingData.title,
              start: bookingData.start,
              end: bookingData.end,
              roomId: bookingData.roomId,
              notes: bookingData.notes
            }
          : booking
      ));
      
      setShowBookingForm(false);
      return true;
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      alert('Erro ao atualizar agendamento. Tente novamente.');
      return false;
    }
  };

  // Excluir agendamento
  const handleDeleteBooking = async (bookingId) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);
      
      if (error) throw error;
      
      // Atualizar lista de agendamentos
      setBookings(bookings.filter(booking => booking.id !== bookingId));
      setShowBookingForm(false);
      return true;
    } catch (error) {
      console.error('Erro ao excluir agendamento:', error);
      alert('Erro ao excluir agendamento. Tente novamente.');
      return false;
    }
  };

  // Componente para estilizar os eventos no calendário
  const eventStyleGetter = (event) => {
    return {
      style: {
        backgroundColor: event.roomColor || '#3174ad',
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
      }
    };
  };

  // Formatar título do evento para mostrar detalhes
  const eventPropGetter = (event) => {
    return {
      title: `${event.title} (${event.roomName}) - ${event.userName}`
    };
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">Agendamento de Salas</h2>
        
        <div className="flex gap-2">
          <select
            className="p-2 border rounded"
            value={selectedRoom || ''}
            onChange={(e) => setSelectedRoom(e.target.value || null)}
          >
            {isAdmin && <option value="">Todas as salas</option>}
            {rooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => {
              setSelectedSlot({
                start: new Date(),
                end: new Date(new Date().setHours(new Date().getHours() + 1))
              });
              setSelectedEvent(null);
              setShowBookingForm(true);
            }}
          >
            Novo Agendamento
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
        <Calendar
          localizer={localizer}
          events={filteredBookings}
          startAccessor="start"
          endAccessor="end"
          selectable
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          style={{ height: 600 }}
          eventPropGetter={eventStyleGetter}
          views={['month', 'week', 'day']}
          min={new Date(0, 0, 0, 8, 0)} // Horário mínimo: 8h
          max={new Date(0, 0, 0, 18, 0)} // Horário máximo: 18h
          formats={{
            timeGutterFormat: (date, culture, localizer) =>
              localizer.format(date, 'HH:mm', culture),
            eventTimeRangeFormat: ({ start, end }, culture, localizer) =>
              `${localizer.format(start, 'HH:mm', culture)} - ${localizer.format(end, 'HH:mm', culture)}`
          }}
        />
      </div>
      
      {showBookingForm && (
        <BookingForm
          rooms={rooms}
          selectedRoom={selectedRoom}
          slot={selectedSlot}
          event={selectedEvent}
          onSubmit={selectedEvent ? handleUpdateBooking : handleAddBooking}
          onDelete={handleDeleteBooking}
          onCancel={() => setShowBookingForm(false)}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

// src/components/booking/BookingForm.jsx
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

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
  const [booking, setBooking] = useState({
    id: event?.id || null,
    title: event?.title || '',
    start: event?.start || slot?.start || new Date(),
    end: event?.end || slot?.end || new Date(new Date().setHours(new Date().getHours() + 1)),
    roomId: event?.roomId || selectedRoom || (rooms[0]?.id || ''),
    notes: event?.notes || ''
  });

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