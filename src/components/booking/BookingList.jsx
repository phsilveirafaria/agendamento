 
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import supabase from '../../hooks/useSupabase';
import { useAuth } from '../../contexts/AuthContext';

export default function BookingList({ onSelectBooking }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('upcoming');
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      
      let query = supabase
        .from('bookings')
        .select(`
          id,
          title,
          start_time,
          end_time,
          room_id,
          user_id,
          notes,
          rooms(name, color),
          profiles(name)
        `);
      
      // Filtrar por usuário se não for admin
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }
      
      // Aplicar filtro de data
      if (filter === 'upcoming') {
        query = query.gte('start_time', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.lt('start_time', new Date().toISOString());
      }
      
      // Ordenar por data de início
      query = query.order('start_time', { ascending: filter !== 'past' });
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Erro ao buscar agendamentos:', error);
        setLoading(false);
        return;
      }
      
      if (data) {
        const formattedBookings = data.map(booking => ({
          id: booking.id,
          title: booking.title,
          start: new Date(booking.start_time),
          end: new Date(booking.end_time),
          roomId: booking.room_id,
          roomName: booking.rooms.name,
          roomColor: booking.rooms.color,
          userId: booking.user_id,
          userName: booking.profiles.name,
          notes: booking.notes
        }));
        
        setBookings(formattedBookings);
      }
      
      setLoading(false);
    }
    
    if (user) {
      fetchBookings();
    }
  }, [user, isAdmin, filter]);

  const formatDate = (date) => {
    return format(date, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Meus Agendamentos</h3>
        
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 text-sm rounded ${
              filter === 'upcoming' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setFilter('upcoming')}
          >
            Próximos
          </button>
          <button
            className={`px-3 py-1 text-sm rounded ${
              filter === 'past' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setFilter('past')}
          >
            Anteriores
          </button>
          <button
            className={`px-3 py-1 text-sm rounded ${
              filter === 'all' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setFilter('all')}
          >
            Todos
          </button>
        </div>
      </div>
      
      {loading ? (
        <p className="text-center py-4">Carregando...</p>
      ) : bookings.length > 0 ? (
        <div className="divide-y">
          {bookings.map(booking => (
            <div 
              key={booking.id}
              className="py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => onSelectBooking && onSelectBooking(booking)}
            >
              <div className="flex items-start">
                <div 
                  className="w-3 h-3 mt-1.5 rounded-full mr-2 flex-shrink-0" 
                  style={{ backgroundColor: booking.roomColor }}
                ></div>
                <div className="flex-grow">
                  <h4 className="font-medium">{booking.title}</h4>
                  <p className="text-sm text-gray-500">
                    {formatDate(booking.start)} - {format(booking.end, 'HH:mm')}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Sala:</span> {booking.roomName}
                  </p>
                  {isAdmin && booking.userId !== user.id && (
                    <p className="text-sm text-gray-500">
                      <span className="font-medium">Agendado por:</span> {booking.userName}
                    </p>
                  )}
                  {booking.notes && (
                    <p className="text-sm mt-1 text-gray-700">{booking.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <p>Nenhum agendamento {filter === 'upcoming' ? 'futuro' : filter === 'past' ? 'anterior' : ''} encontrado.</p>
        </div>
      )}
    </div>
  );
}