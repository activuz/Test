import { useAuth } from '@/app/contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { User, MapPin, Calendar, Globe, ArrowLeft, LogOut, CheckCircle2, Edit2, Save, X } from 'lucide-react';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import fileData from '../../../file.json';
import { useState, useEffect } from 'react';

export function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  useEffect(() => {
    if (user?.onboardingData) {
      setEditForm(user.onboardingData);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSave = async () => {
    await updateUser({ onboardingData: editForm });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditForm(user?.onboardingData || {});
    setIsEditing(false);
  };

  const info = user?.onboardingData || {};

  // Find Region/District options from file.json by flattening all fields
  const allFields = fileData.onboarding_stages.flatMap(s => s.steps.flatMap((st: any) => st.fields));
  const regionField = allFields.find((f: any) => f.field === 'region');
  const districtField = allFields.find((f: any) => f.field === 'district');

  const regions = (regionField?.options as string[]) || [];
  const districtsByRegion = (districtField as any)?.options_by_region || {};

  const currentRegionDistricts = editForm.region ? (districtsByRegion[editForm.region] as string[] || []) : [];

  const profileFields = [
    { label: 'Ism', value: info.name, icon: User },
    { label: 'Familiya', value: info.surname, icon: User },
    { label: 'Tug\'ilgan sana', value: info.birth_date, icon: Calendar },
    { label: 'Jins', value: info.gender, icon: User },
    { label: 'Viloyat', value: info.region, icon: MapPin },
    { label: 'Tuman', value: info.district, icon: MapPin },
    { label: 'Muloqot tili', value: info.language, icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans pb-12">
      {/* Header */}
      <header className="px-8 py-5 flex justify-between items-center bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="p-2 bg-purple-50 rounded-xl">
             <ArrowLeft className="h-5 w-5 text-purple-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Profil Ma'lumotlari</h1>
        </div>
        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Chiqish
        </Button>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-10">
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Avatar Card */}
          <div className="md:col-span-1">
            <Card className="p-8 rounded-[2.5rem] bg-white shadow-xl shadow-purple-100/50 border-purple-50 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white text-4xl font-bold shadow-lg mb-6">
                {info.name?.[0]}{info.surname?.[0]}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{info.name} {info.surname}</h2>
              <p className="text-gray-500 text-sm mt-1">{user?.email}</p>
              
              <div className="mt-8 w-full space-y-3">
                {user?.onboardingCompleted ? (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-2xl border border-green-100">
                    <span className="text-xs font-semibold text-green-700">Onboarding: Bajarildi</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => navigate('/onboarding')}>
                    <span className="text-xs font-semibold text-orange-700">Onboarding: Kutilmoqda</span>
                    <ArrowLeft className="h-4 w-4 text-orange-600 rotate-180" />
                  </div>
                )}
                
                {user?.iqScore ? (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-2xl border border-blue-100">
                    <span className="text-xs font-semibold text-blue-700">IQ Test</span>
                    <span className="text-xs font-bold text-blue-800">{user.iqScore}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl border border-orange-100 cursor-pointer hover:bg-orange-100 transition-colors" onClick={() => navigate('/iq-test')}>
                    <span className="text-xs font-semibold text-orange-700">IQ Test (Kutilmoqda)</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Details Card */}
          <div className="md:col-span-2">
            <Card className="p-8 rounded-[2.5rem] bg-white shadow-sm border-gray-100 h-full relative">
              <div className="flex justify-between items-center mb-8 pb-4 border-b">
                <h3 className="text-xl font-bold text-gray-800">Asosiy ma'lumotlar</h3>
                {!isEditing ? (
                  <Button variant="ghost" size="sm" className="text-purple-600 hover:bg-purple-50 rounded-xl" onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Tahrirlash
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:bg-gray-50 rounded-xl" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Bekor qilish
                    </Button>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Saqlash
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="grid sm:grid-cols-2 gap-8">
                {/* Name */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ism</p>
                    {isEditing ? (
                      <Input value={editForm.name || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({...editForm, name: e.target.value})} className="h-9 rounded-lg" />
                    ) : (
                      <p className="text-gray-900 font-medium">{info.name || 'Nomalum'}</p>
                    )}
                  </div>
                </div>

                {/* Surname */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Familiya</p>
                    {isEditing ? (
                      <Input value={editForm.surname || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({...editForm, surname: e.target.value})} className="h-9 rounded-lg" />
                    ) : (
                      <p className="text-gray-900 font-medium">{info.surname || 'Nomalum'}</p>
                    )}
                  </div>
                </div>

                {/* Birth Date */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tug'ilgan sana</p>
                    {isEditing ? (
                      <Input type="date" value={editForm.birth_date || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({...editForm, birth_date: e.target.value})} className="h-9 rounded-lg" />
                    ) : (
                      <p className="text-gray-900 font-medium">{info.birth_date || 'Nomalum'}</p>
                    )}
                  </div>
                </div>

                {/* Gender */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Jins</p>
                    {isEditing ? (
                       <Select value={editForm.gender || ''} onValueChange={(val: string) => setEditForm({...editForm, gender: val})}>
                         <SelectTrigger className="h-9 rounded-lg"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Erkak">Erkak</SelectItem>
                           <SelectItem value="Ayol">Ayol</SelectItem>
                         </SelectContent>
                       </Select>
                    ) : (
                      <p className="text-gray-900 font-medium">{info.gender || 'Nomalum'}</p>
                    )}
                  </div>
                </div>

                {/* Region */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Viloyat</p>
                    {isEditing ? (
                       <Select value={editForm.region || ''} onValueChange={(val: string) => setEditForm({...editForm, region: val, district: ''})}>
                         <SelectTrigger className="h-9 rounded-lg"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                         <SelectContent>
                           {regions.map((r: string) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    ) : (
                      <p className="text-gray-900 font-medium">{info.region || 'Nomalum'}</p>
                    )}
                  </div>
                </div>

                {/* District */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Tuman</p>
                    {isEditing ? (
                       <Select value={editForm.district || ''} onValueChange={(val: string) => setEditForm({...editForm, district: val})}>
                         <SelectTrigger className="h-9 rounded-lg"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                         <SelectContent>
                           {currentRegionDistricts.map((d: string) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                         </SelectContent>
                       </Select>
                    ) : (
                      <p className="text-gray-900 font-medium">{info.district || 'Nomalum'}</p>
                    )}
                  </div>
                </div>

                {/* Language */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Muloqot tili</p>
                    {isEditing ? (
                       <Select value={editForm.language || ''} onValueChange={(val: string) => setEditForm({...editForm, language: val})}>
                         <SelectTrigger className="h-9 rounded-lg"><SelectValue placeholder="Tanlang" /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="O'zbek">O'zbek</SelectItem>
                           <SelectItem value="Rus">Rus</SelectItem>
                           <SelectItem value="Ingliz">Ingliz</SelectItem>
                         </SelectContent>
                       </Select>
                    ) : (
                      <p className="text-gray-900 font-medium">{info.language || 'Nomalum'}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-500 leading-relaxed text-center italic">
                  Ushbu ma'lumotlar HamrohAi platformasida shaxsiy profilingizni shakllantirish va sizga eng mos ta'lim yo'nalishlarini tavsiya qilish uchun ishlatiladi.
                </p>
              </div>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}
