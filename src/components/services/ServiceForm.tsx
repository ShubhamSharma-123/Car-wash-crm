import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea, Checkbox } from '@/components/ui/Input';
import { ServiceThumb } from '@/components/ui/Logo';
import { useStore, nextId } from '@/context/StoreContext';
import { cn } from '@/utils/cn';
import type { Service, ServiceCategory, VehicleType } from '@/types';

const schema = z.object({
  name: z.string().min(3, 'Service name is required'),
  description: z.string().min(15, 'Add a short description (min 15 characters)'),
  price: z.coerce.number().min(99, 'Minimum price is ₹99'),
  duration: z.coerce.number().min(10, 'Minimum duration is 10 minutes'),
  category: z.enum(['Wash', 'Detailing', 'Protection', 'Interior', 'Add-on']),
  active: z.boolean(),
  imageTone: z.string(),
});

type FormValues = z.infer<typeof schema>;

const tones = ['blue', 'navy', 'teal', 'emerald', 'amber', 'rose', 'violet', 'sky', 'indigo', 'slate', 'cyan', 'fuchsia'];
const vehicleTypes: VehicleType[] = ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury'];

export function ServiceFormModal({
  open,
  onClose,
  service,
}: {
  open: boolean;
  onClose: () => void;
  service?: Service | null;
}) {
  const { services, dispatch } = useStore();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', price: 499, duration: 30, category: 'Wash', active: true, imageTone: 'blue' },
  });

  const [types, setTypes] = React.useState<VehicleType[]>(vehicleTypes);
  const tone = watch('imageTone');
  const name = watch('name');

  useEffect(() => {
    if (!open) return;
    reset(
      service
        ? {
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            category: service.category,
            active: service.active,
            imageTone: service.imageTone,
          }
        : { name: '', description: '', price: 499, duration: 30, category: 'Wash', active: true, imageTone: 'blue' }
    );
    setTypes(service?.vehicleTypes || vehicleTypes);
  }, [open, service, reset]);

  const onSubmit = (v: FormValues) => {
    const payload: Service = {
      id: service?.id || nextId('SRV', services),
      name: v.name,
      description: v.description,
      price: v.price,
      duration: v.duration,
      vehicleTypes: types,
      category: v.category as ServiceCategory,
      active: v.active,
      imageTone: v.imageTone,
      bookings: service?.bookings || 0,
    };
    dispatch(service ? { type: 'UPDATE_SERVICE', payload } : { type: 'ADD_SERVICE', payload });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={service ? `Edit ${service.name}` : 'Add new service'}
      description={service ? 'Update pricing, duration and availability.' : 'Create a new offering for the service catalogue.'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" leftIcon={service ? <Save className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />} onClick={handleSubmit(onSubmit)}>
            {service ? 'Save changes' : 'Add service'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <ServiceThumb tone={tone} name={name || 'New Service'} />
          <div className="min-w-0">
            <p className="truncate text-[12.5px] font-medium text-navy-900">{name || 'New service'}</p>
            <p className="text-[11px] text-slate-500">Thumbnail colour</p>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {tones.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue('imageTone', t)}
                  aria-label={`Use ${t} tone`}
                  className={cn(
                    'h-4 w-4 rounded-full ring-2 ring-offset-1 transition-transform hover:scale-110',
                    tone === t ? 'ring-navy-900' : 'ring-transparent'
                  )}
                  style={{ background: toneHex(t) }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Service name" required error={errors.name?.message} className="sm:col-span-2">
            <Input {...register('name')} placeholder="e.g. Premium Wash" invalid={!!errors.name} />
          </Field>
          <Field label="Price (INR)" required error={errors.price?.message}>
            <Input type="number" {...register('price')} invalid={!!errors.price} leftIcon={<span className="text-[12px]">₹</span>} />
          </Field>
          <Field label="Duration (minutes)" required error={errors.duration?.message}>
            <Input type="number" {...register('duration')} invalid={!!errors.duration} />
          </Field>
          <Field label="Service category" required>
            <Select
              {...register('category')}
              options={['Wash', 'Detailing', 'Protection', 'Interior', 'Add-on'].map((c) => ({ value: c, label: c }))}
            />
          </Field>
          <Field label="Status">
            <Select {...register('active', { setValueAs: (v) => v === 'true' })} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
          </Field>
        </div>

        <Field label="Applicable vehicle types">
          <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-slate-200 p-2.5">
            {vehicleTypes.map((t) => (
              <Checkbox
                key={t}
                checked={types.includes(t)}
                onChange={(c) => setTypes((prev) => (c ? [...prev, t] : prev.filter((x) => x !== t)))}
                label={t}
              />
            ))}
          </div>
        </Field>

        <Field label="Description" required error={errors.description?.message} hint="Shown to customers in the booking flow">
          <Textarea {...register('description')} rows={3} placeholder="What's included, products used, ideal frequency…" invalid={!!errors.description} />
        </Field>
      </form>
    </Modal>
  );
}

function toneHex(t: string) {
  const map: Record<string, string> = {
    blue: '#2563eb', navy: '#1c3358', teal: '#0d9488', emerald: '#059669', amber: '#d97706',
    rose: '#e11d48', violet: '#7c3aed', sky: '#0284c7', indigo: '#4f46e5', slate: '#64748b',
    cyan: '#0891b2', fuchsia: '#c026d3',
  };
  return map[t] || '#2563eb';
}
