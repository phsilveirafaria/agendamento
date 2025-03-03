 
import React, { useState, useEffect } from 'react';
import supabase from '../../hooks/useSupabase';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 1,
    color: '#3174ad',
    description: ''
  });

  // Carregar salas
  useEffect(() => {
    async function fetchRooms() {
      setLoading(true);
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name');
      
      if (data) {
        setRooms(data);
      }
      
      setLoading(false);
    }
    
    fetchRooms();
  }, []);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      capacity: room.capacity,
      color: room.color,
      description: room.description || ''
    });
  };

  const handleNewRoom = () => {
    setSelectedRoom(null);
    setFormData({
      name: '',
      capacity: 1,
      color: '#3174ad',
      description: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'capacity') {
        return { ...prev, [name]: parseInt(value) || 1 };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleColorChange = (e) => {
    setFormData(prev => ({ ...prev, color: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (selectedRoom) {
        // Atualizar sala existente
        const { error } = await supabase
          .from('rooms')
          .update({
            name: formData.name,
            capacity: formData.capacity,
            color: formData.color,
            description: formData.description
          })
          .eq('id', selectedRoom.id);
        
        if (error) throw error;
        
        // Atualizar lista de salas
        setRooms(rooms.map(room => 
          room.id === selectedRoom.id
            ? { 
                ...room, 
                name: formData.name,
                capacity: formData.capacity,
                color: formData.color,
                description: formData.description
              }
            : room
        ));
        
        alert('Sala atualizada com sucesso!');
      } else {
        // Criar nova sala
        const { data, error } = await supabase
          .from('rooms')
          .insert([{
            name: formData.name,
            capacity: formData.capacity,
            color: formData.color,
            description: formData.description
          }])
          .select();
        
        if (error) throw error;
        
        // Adicionar à lista de salas
        setRooms([...rooms, data[0]]);
        
        // Limpar formulário
        setFormData({
          name: '',
          capacity: 1,
          color: '#3174ad',
          description: ''
        });
        
        alert('Sala criada com sucesso!');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta sala? Todos os agendamentos associados serão excluídos.')) {
      return;
    }
    
    try {
      // Excluir sala
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);
      
      if (error) throw error;
      
      // Atualizar lista de salas
      setRooms(rooms.filter(room => room.id !== roomId));
      
      if (selectedRoom && selectedRoom.id === roomId) {
        setSelectedRoom(null);
        setFormData({
          name: '',
          capacity: 1,
          color: '#3174ad',
          description: ''
        });
      }
      
      alert('Sala excluída com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      alert(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Gerenciamento de Salas</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold">Salas</h3>
            <button
              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
              onClick={handleNewRoom}
            >
              Nova Sala
            </button>
          </div>
          
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <div className="divide-y">
              {rooms.map(room => (
                <div 
                  key={room.id} 
                  className={`py-2 cursor-pointer ${selectedRoom?.id === room.id ? 'bg-blue-50' : ''}`}
                  onClick={() => handleSelectRoom(room)}
                >
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-2" 
                      style={{ backgroundColor: room.color }}
                    ></div>
                    <div>
                      <p className="font-medium">{room.name}</p>
                      <p className="text-sm text-gray-500">Capacidade: {room.capacity} pessoas</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-4">
            {selectedRoom ? 'Editar Sala' : 'Nova Sala'}
          </h3>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Nome da Sala</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Capacidade</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                min="1"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
              <input
                type="color"
                name="color"
                value={formData.color}
                onChange={handleColorChange}
                className="block w-16 h-8"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Descrição</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows="3"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-2">
              {selectedRoom && (
                <button
                  type="button"
                  onClick={() => handleDelete(selectedRoom.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Excluir
                </button>
              )}
              
              <button
                type="button"
                onClick={handleNewRoom}
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
    </div>
  );
}