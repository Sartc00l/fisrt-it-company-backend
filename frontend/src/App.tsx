import { useEffect, useState } from 'react';
import api from './api';

interface BaseReference {
  id: number;
  name: string;
}

interface Category extends BaseReference {
  type: number;
}

interface Subcategory extends BaseReference {
  category: number;
}

interface Transaction {
  id: number;
  date: string;
  amount: string;
  comment: string;
  status: number;
  type: number;
  category: number;
  subcategory: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'panel' | 'references'>('panel');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statuses, setStatuses] = useState<BaseReference[]>([]);
  const [types, setTypes] = useState<BaseReference[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [comment, setComment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubcategory, setFilterSubcategory] = useState('');

  const [editingRef, setEditingRef] = useState<{ endpoint: string; id: number } | null>(null);
  const [newStatusName, setNewStatusName] = useState('');
  const [newTypeName, setNewTypeName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryTypeId, setNewCategoryTypeId] = useState('');
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryCatId, setNewSubcategoryCatId] = useState('');

  const [refErrors, setRefErrors] = useState<{ [key: string]: string }>({});

  const initAppData = async (queryParams = '') => {
    try {
      setLoading(true);
      const [resTx, resStatus, resType, resCat, resSub] = await Promise.all([
        api.get<Transaction[]>(`/transactions/${queryParams}`),
        api.get<BaseReference[]>('/statuses/').catch(() => ({ data: [] })), 
        api.get<BaseReference[]>('/types/').catch(() => ({ data: [] })),
        api.get<Category[]>('/categories/').catch(() => ({ data: [] })),
        api.get<Subcategory[]>('/subcategories/').catch(() => ({ data: [] }))
      ]);

      setTransactions(resTx.data);
      setStatuses(resStatus.data);
      setTypes(resType.data);
      setCategories(resCat.data);
      setSubcategories(resSub.data);

      if (resStatus.data.length && !selectedStatus) setSelectedStatus(String(resStatus.data[0].id));
      if (resType.data.length && !selectedType) setSelectedType(String(resType.data[1]?.id || resType.data[0].id));
      if (resCat.data.length && !selectedCategory) setSelectedCategory(String(resCat.data[0].id));
      if (resSub.data.length && !selectedSubcategory) setSelectedSubcategory(String(resSub.data[0].id));

      if (resType.data.length && !newCategoryTypeId) setNewCategoryTypeId(String(resType.data[0].id));
      if (resCat.data.length && !newSubcategoryCatId) setNewSubcategoryCatId(String(resCat.data[0].id));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (filterStartDate) params.append('start_date', filterStartDate);
    if (filterEndDate) params.append('end_date', filterEndDate);
    if (filterStatus) params.append('status', filterStatus);
    if (filterType) params.append('type', filterType);
    if (filterCategory) params.append('category', filterCategory);
    if (filterSubcategory) params.append('subcategory', filterSubcategory);

    const stringParams = params.toString();
    initAppData(stringParams ? `?${stringParams}` : '');
  }, [filterStartDate, filterEndDate, filterStatus, filterType, filterCategory, filterSubcategory]);

  const filteredCategories = categories.filter(cat => cat.type === parseInt(selectedType));
  const filteredSubcategories = subcategories.filter(sub => sub.category === parseInt(selectedCategory));

  const filterCategoriesList = categories.filter(cat => !filterType || cat.type === parseInt(filterType));
  const filterSubcategoriesList = subcategories.filter(sub => !filterCategory || sub.category === parseInt(filterCategory));

  const handleEditClick = (t: Transaction) => {
    setEditingId(t.id);
    setDate(t.date);
    setAmount(t.amount);
    setComment(t.comment);
    setSelectedStatus(String(t.status));
    setSelectedType(String(t.type));
    setSelectedCategory(String(t.category));
    setSelectedSubcategory(String(t.subcategory));
    setActiveTab('panel');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setAmount('');
    setComment('');
    if (statuses.length) setSelectedStatus(String(statuses[0].id));
    if (types.length) setSelectedType(String(types[1]?.id || types[0].id));
    if (categories.length) setSelectedCategory(String(categories[0].id));
    if (subcategories.length) setSelectedSubcategory(String(subcategories[0].id));
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту запись?')) return;
    try {
      await api.delete(`/transactions/${id}/`);
      setTransactions(transactions.filter(t => t.id !== id));
      if (editingId === id) handleCancelEdit();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date,
      amount,
      comment,
      status: parseInt(selectedStatus),
      type: parseInt(selectedType),
      category: parseInt(selectedCategory),
      subcategory: parseInt(selectedSubcategory),
    };

    try {
      if (editingId) {
        await api.put(`/transactions/${editingId}/`, payload);
        setEditingId(null);
      } else {
        await api.post('/transactions/', payload);
      }
      setAmount('');
      setComment('');
      initAppData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReference = async (endpoint: string, payload: object, clearFields: () => void) => {
    try {
      if (editingRef && editingRef.endpoint === endpoint) {
        await api.put(`/${endpoint}/${editingRef.id}/`, payload);
        setEditingRef(null);
      } else {
        await api.post(`/${endpoint}/`, payload);
      }
      clearFields();
      initAppData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelRefEdit = (clearFields: () => void) => {
    setEditingRef(null);
    clearFields();
  };

  const showRefError = (endpoint: string, message: string) => {
    setRefErrors(prev => ({ ...prev, [endpoint]: message }));
    setTimeout(() => {
      setRefErrors(prev => {
        const copy = { ...prev };
        delete copy[endpoint];
        return copy;
      });
    }, 5000);
  };

  const handleDeleteReference = async (endpoint: string, id: number) => {
    if (!confirm('Удалить этот элемент справочника?')) return;
    try {
      await api.delete(`/${endpoint}/${id}/`);
      if (editingRef && editingRef.endpoint === endpoint && editingRef.id === id) {
        setEditingRef(null);
      }
      initAppData();
    } catch (err: any) {
      if (err.response && err.response.status === 500) {
        showRefError(endpoint, 'Нельзя удалить: элемент используется в существующих транзакциях');
      } else {
        showRefError(endpoint, 'Ошибка при удалении элемента справочника');
      }
    }
  };

  const getRefName = (list: BaseReference[], id: number) => list.find(item => item.id === id)?.name || `ID ${id}`;

  return (
    <div className="min-h-screen text-gray-100 px-4 md:px-8 py-8 w-full font-sans box-border">
      <div className="w-full space-y-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-800 pb-5 gap-4">
          <header className="text-left">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white m-0">ДДС Панель</h1>
            <p className="text-sm text-gray-400 mt-1">Система оперативного учета движений денежных средств</p>
          </header>
          <div className="flex bg-[#1c1d26] p-1 rounded-xl border border-gray-800 self-start sm:self-center">
            <button onClick={() => setActiveTab('panel')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activeTab === 'panel' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              Учет операций
            </button>
            <button onClick={() => setActiveTab('references')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${activeTab === 'references' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
              Справочники
            </button>
          </div>
        </div>

        {activeTab === 'panel' ? (
          <div className="flex flex-col lg:flex-row gap-8 items-start text-left w-full">
            
            <div className="w-full lg:w-80 xl:w-96 shrink-0 bg-[#1c1d26] border border-gray-800 p-6 rounded-xl space-y-4 shadow-lg box-border">
              <h2 className="text-xl font-semibold text-white m-0">
                {editingId ? `Правка операции #${editingId}` : 'Добавить операцию'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Дата</label>
                  <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Сумма (₽)</label>
                  <input type="number" step="0.01" required placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Комментарий</label>
                  <input type="text" placeholder="Назначение платежа" value={comment} onChange={e => setComment(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Статус</label>
                    <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-blue-500">
                      {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Тип</label>
                    <select value={selectedType} onChange={e => { setSelectedType(e.target.value); setSelectedCategory(''); }} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-blue-500">
                      {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Категория</label>
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-blue-500">
                      {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      {filteredCategories.length === 0 && <option value="">Нет</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">Подкат.</label>
                    <select value={selectedSubcategory} onChange={e => setSelectedSubcategory(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-2 text-white focus:outline-none focus:border-blue-500">
                      {filteredSubcategories.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                      {filteredSubcategories.length === 0 && <option value="">Нет</option>}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-lg transition-colors m-0 shadow-lg shadow-blue-900/20 cursor-pointer">
                    {editingId ? 'Сохранить изменения' : 'Провести операцию'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={handleCancelEdit} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition-colors border border-gray-700 cursor-pointer">
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="flex-1 w-full bg-[#1c1d26] border border-gray-800 p-6 rounded-xl space-y-4 shadow-lg box-border overflow-hidden">
              <h2 className="text-xl font-semibold text-white m-0">История транзакций</h2>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3 bg-[#16171d]/40 p-4 rounded-xl border border-gray-800/60 items-end">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">С даты</label>
                  <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">По дату</label>
                  <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Статус</label>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                    <option value="">Все</option>
                    {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Тип</label>
                  <select value={filterType} onChange={e => { setFilterType(e.target.value); setFilterCategory(''); setFilterSubcategory(''); }} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                    <option value="">Все</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Категория</label>
                  <select value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setFilterSubcategory(''); }} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                    <option value="">Все</option>
                    {filterCategoriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Подкат.</label>
                  <select value={filterSubcategory} onChange={e => setFilterSubcategory(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none">
                    <option value="">Все</option>
                    {filterSubcategoriesList.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
                </div>
                <div>
                  <button type="button" onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterStatus(''); setFilterType(''); setFilterCategory(''); setFilterSubcategory(''); }} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-1.5 rounded-lg transition-colors border border-gray-700 text-xs cursor-pointer">
                    Сбросить
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="text-gray-400 text-sm animate-pulse">Загрузка данных...</div>
              ) : transactions.length === 0 ? (
                <div className="text-gray-500 text-sm py-12 text-center border border-dashed border-gray-800 rounded-xl">
                  Записей не найдено. Измените параметры фильтрации или добавьте новую операцию.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-800 max-w-full">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="bg-[#242631] border-b border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <tr>
                        <th className="py-4 px-4 w-16">ID</th>
                        <th className="py-4 px-4 w-28">Дата</th>
                        <th className="py-4 px-4 w-40">Сумма</th>
                        <th className="py-4 px-4 w-72">Связи (Статус / Кат. / Подкат.)</th>
                        <th className="py-4 px-4">Комментарий</th>
                        <th className="py-4 px-4 w-32 text-right">Действия</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm bg-[#16171d]/50">
                      {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-[#242631]/50 transition-colors">
                          <td className="py-4 px-4 text-gray-500 font-mono">#{t.id}</td>
                          <td className="py-4 px-4 text-gray-300 whitespace-nowrap">{t.date}</td>
                          <td className={`py-4 px-4 font-semibold whitespace-nowrap ${t.type === 1 ? 'text-green-400' : 'text-red-400'}`}>
                            {t.type === 1 ? '+' : ''}{parseFloat(t.amount).toLocaleString('ru-RU', { minimumFractionDigits: 2 })} ₽
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-1.5">
                              <span className="bg-gray-800 px-2 py-0.5 rounded text-gray-300 border border-gray-700 text-[11px] font-medium whitespace-nowrap">{getRefName(statuses, t.status)}</span>
                              <span className="bg-blue-950 px-2 py-0.5 rounded text-blue-300 border border-blue-900/50 text-[11px] font-medium whitespace-nowrap">{getRefName(categories, t.category)}</span>
                              <span className="bg-purple-950 px-2 py-0.5 rounded text-purple-300 border border-purple-900/50 text-[11px] font-medium whitespace-nowrap">{getRefName(subcategories, t.subcategory)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-400 break-words max-w-0">{t.comment || '—'}</td>
                          <td className="py-4 px-4 text-right space-x-2 whitespace-nowrap">
                            <button onClick={() => handleEditClick(t)} className="text-blue-400 hover:text-blue-300 text-xs font-medium bg-none border-none cursor-pointer p-0">
                              Изменить
                            </button>
                            <button onClick={() => handleDelete(t.id)} className="text-red-400 hover:text-red-300 text-xs font-medium bg-none border-none cursor-pointer p-0">
                              Удалить
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left w-full">
            
            <div className="bg-[#1c1d26] border border-gray-800 p-6 rounded-xl space-y-4 shadow-lg box-border">
              <h3 className="text-lg font-semibold text-white m-0">
                {editingRef && editingRef.endpoint === 'statuses' ? `Правка статуса ID ${editingRef.id}` : 'Статусы'}
              </h3>
              {refErrors.statuses && (
                <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-3 py-2 rounded-lg font-medium">{refErrors.statuses}</div>
              )}
              <div className="flex gap-2">
                <input type="text" placeholder="Название статуса" value={newStatusName} onChange={e => setNewStatusName(e.target.value)} className="flex-1 bg-[#16171d] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none" />
                <button onClick={() => handleSaveReference('statuses', { name: newStatusName }, () => setNewStatusName(''))} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  {editingRef && editingRef.endpoint === 'statuses' ? 'Сохранить' : 'Добавить'}
                </button>
                {editingRef && editingRef.endpoint === 'statuses' && (
                  <button onClick={() => handleCancelRefEdit(() => setNewStatusName(''))} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700 cursor-pointer">Отмена</button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto border border-gray-800 rounded-lg divide-y divide-gray-800">
                {statuses.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 text-sm bg-[#16171d]/30">
                    <span className="text-gray-300">{s.name}</span>
                    <div className="space-x-3">
                      <button onClick={() => { setEditingRef({ endpoint: 'statuses', id: s.id }); setNewStatusName(s.name); }} className="text-blue-400 hover:text-blue-300 text-xs bg-none border-none cursor-pointer">Изменить</button>
                      <button onClick={() => handleDeleteReference('statuses', s.id)} className="text-red-400 hover:text-red-300 text-xs bg-none border-none cursor-pointer">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1c1d26] border border-gray-800 p-6 rounded-xl space-y-4 shadow-lg box-border">
              <h3 className="text-lg font-semibold text-white m-0">
                {editingRef && editingRef.endpoint === 'types' ? `Правка типа ID ${editingRef.id}` : 'Типы операций'}
              </h3>
              {refErrors.types && (
                <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-3 py-2 rounded-lg font-medium">{refErrors.types}</div>
              )}
              <div className="flex gap-2">
                <input type="text" placeholder="Название типа" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} className="flex-1 bg-[#16171d] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none" />
                <button onClick={() => handleSaveReference('types', { name: newTypeName }, () => setNewTypeName(''))} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                  {editingRef && editingRef.endpoint === 'types' ? 'Сохранить' : 'Добавить'}
                </button>
                {editingRef && editingRef.endpoint === 'types' && (
                  <button onClick={() => handleCancelRefEdit(() => setNewTypeName(''))} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700 cursor-pointer">Отмена</button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto border border-gray-800 rounded-lg divide-y divide-gray-800">
                {types.map(t => (
                  <div key={t.id} className="flex justify-between items-center p-3 text-sm bg-[#16171d]/30">
                    <span className="text-gray-300">{t.name}</span>
                    <div className="space-x-3">
                      <button onClick={() => { setEditingRef({ endpoint: 'types', id: t.id }); setNewTypeName(t.name); }} className="text-blue-400 hover:text-blue-300 text-xs bg-none border-none cursor-pointer">Изменить</button>
                      <button onClick={() => handleDeleteReference('types', t.id)} className="text-red-400 hover:text-red-300 text-xs bg-none border-none cursor-pointer">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1c1d26] border border-gray-800 p-6 rounded-xl space-y-4 shadow-lg box-border">
              <h3 className="text-lg font-semibold text-white m-0">
                {editingRef && editingRef.endpoint === 'categories' ? `Правка категории ID ${editingRef.id}` : 'Категории'}
              </h3>
              {refErrors.categories && (
                <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-3 py-2 rounded-lg font-medium">{refErrors.categories}</div>
              )}
              <div className="space-y-2">
                <select value={newCategoryTypeId} onChange={e => setNewCategoryTypeId(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none">
                  {types.map(t => <option key={t.id} value={t.id}>Связанный тип: {t.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="text" placeholder="Название категории" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="flex-1 bg-[#16171d] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none" />
                  <button onClick={() => handleSaveReference('categories', { name: newCategoryName, type: parseInt(newCategoryTypeId) }, () => setNewCategoryName(''))} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                    {editingRef && editingRef.endpoint === 'categories' ? 'Сохранить' : 'Добавить'}
                  </button>
                  {editingRef && editingRef.endpoint === 'categories' && (
                    <button onClick={() => handleCancelRefEdit(() => setNewCategoryName(''))} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700 cursor-pointer">Отмена</button>
                  )}
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto border border-gray-800 rounded-lg divide-y divide-gray-800">
                {categories.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-3 text-sm bg-[#16171d]/30">
                    <div className="flex flex-col">
                      <span className="text-gray-300 font-medium">{c.name}</span>
                      <span className="text-xs text-gray-500">Тип: {getRefName(types, c.type)}</span>
                    </div>
                    <div className="space-x-3">
                      <button onClick={() => { setEditingRef({ endpoint: 'categories', id: c.id }); setNewCategoryName(c.name); setNewCategoryTypeId(String(c.type)); }} className="text-blue-400 hover:text-blue-300 text-xs bg-none border-none cursor-pointer">Изменить</button>
                      <button onClick={() => handleDeleteReference('categories', c.id)} className="text-red-400 hover:text-red-300 text-xs bg-none border-none cursor-pointer">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#1c1d26] border border-gray-800 p-6 rounded-xl space-y-4 shadow-lg box-border">
              <h3 className="text-lg font-semibold text-white m-0">
                {editingRef && editingRef.endpoint === 'subcategories' ? `Правка подкатегории ID ${editingRef.id}` : 'Подкатегории'}
              </h3>
              {refErrors.subcategories && (
                <div className="bg-red-950/40 border border-red-900/50 text-red-400 text-xs px-3 py-2 rounded-lg font-medium">{refErrors.subcategories}</div>
              )}
              <div className="space-y-2">
                <select value={newSubcategoryCatId} onChange={e => setNewSubcategoryCatId(e.target.value)} className="w-full bg-[#16171d] border border-gray-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none">
                  {categories.map(c => <option key={c.id} value={c.id}>Связанная кат.: {c.name}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="text" placeholder="Название подкатегории" value={newSubcategoryName} onChange={e => setNewSubcategoryName(e.target.value)} className="flex-1 bg-[#16171d] border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none" />
                  <button onClick={() => handleSaveReference('subcategories', { name: newSubcategoryName, category: parseInt(newSubcategoryCatId) }, () => setNewSubcategoryName(''))} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
                    {editingRef && editingRef.endpoint === 'subcategories' ? 'Сохранить' : 'Добавить'}
                  </button>
                  {editingRef && editingRef.endpoint === 'subcategories' && (
                    <button onClick={() => handleCancelRefEdit(() => setNewSubcategoryName(''))} className="bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg text-sm border border-gray-700 cursor-pointer">Отмена</button>
                  )}
                </div>
              </div>
              <div className="max-h-60 overflow-y-auto border border-gray-800 rounded-lg divide-y divide-gray-800">
                {subcategories.map(sc => (
                  <div key={sc.id} className="flex justify-between items-center p-3 text-sm bg-[#16171d]/30">
                    <div className="flex flex-col">
                      <span className="text-gray-300 font-medium">{sc.name}</span>
                      <span className="text-xs text-gray-500">Кат.: {getRefName(categories, sc.category)}</span>
                    </div>
                    <div className="space-x-3">
                      <button onClick={() => { setEditingRef({ endpoint: 'subcategories', id: sc.id }); setNewSubcategoryName(sc.name); setNewSubcategoryCatId(String(sc.category)); }} className="text-blue-400 hover:text-blue-300 text-xs bg-none border-none cursor-pointer">Изменить</button>
                      <button onClick={() => handleDeleteReference('subcategories', sc.id)} className="text-red-400 hover:text-red-300 text-xs bg-none border-none cursor-pointer">Удалить</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}