import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash, Plus } from 'lucide-react';
import { Toast } from '../Toast';

interface SoldOutDate {
  id: string;
  package_id: string;
  package_title?: string;
  soldout_date: string;
}

interface Props {
  showToast: (message: string, type: 'success' | 'error') => void;
}

export function SoldOutDatesManagement({ showToast }: Props) {
  const [dates, setDates] = useState<SoldOutDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('');

  const fetchDates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('package_soldout_dates')
      .select('id, package_id, soldout_date, packages(title)')
      .order('soldout_date', { ascending: true });

    if (error) return showToast(error.message, 'error');

    setDates(data.map((d: any) => ({
      ...d,
      package_title: d.packages?.title
    })));
    setLoading(false);
  };

  useEffect(() => {
    fetchDates();
  }, []);

  const addDate = async () => {
    if (!selectedPackage || !newDate) return showToast('Select package & date', 'error');

    const { error } = await supabase
      .from('package_soldout_dates')
      .insert({ package_id: selectedPackage, soldout_date: newDate });

    if (error) return showToast(error.message, 'error');

    showToast('Sold-out date added', 'success');
    setNewDate('');
    fetchDates();
  };

  const deleteDate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this sold-out date?')) return;

    const { error } = await supabase
      .from('package_soldout_dates')
      .delete()
      .eq('id', id);

    if (error) return showToast(error.message, 'error');

    showToast('Sold-out date removed', 'success');
    fetchDates();
  };

  const [packages, setPackages] = useState<any[]>([]);
  useEffect(() => {
    supabase.from('packages').select('id, title').then(res => {
      if (res.data) setPackages(res.data);
    });
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Sold-Out Dates</h2>

      <div className="flex items-center space-x-2 mb-4">
        <select
          className="border px-2 py-1 rounded"
          value={selectedPackage}
          onChange={(e) => setSelectedPackage(e.target.value)}
        >
          <option value="">Select Package</option>
          {packages.map(p => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
        <input
          type="date"
          className="border px-2 py-1 rounded"
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
        />
        <button
          onClick={addDate}
          className="bg-blue-600 text-white px-3 py-1 rounded flex items-center"
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">Package</th>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Action</th>
            </tr>
          </thead>
          <tbody>
            {dates.map(d => (
              <tr key={d.id}>
                <td className="border px-2 py-1">{d.package_title}</td>
                <td className="border px-2 py-1">{d.soldout_date}</td>
                <td className="border px-2 py-1">
                  <button
                    onClick={() => deleteDate(d.id)}
                    className="text-red-600 flex items-center"
                  >
                    <Trash className="w-4 h-4 mr-1" /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
