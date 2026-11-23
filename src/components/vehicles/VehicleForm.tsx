import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Car, Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Input';
import { useStore, nextId } from '@/context/StoreContext';
import { formatDate } from '@/utils/date';
import type { Vehicle, VehicleType } from '@/types';

const schema = z.object({
  registration: z
    .string()
    .min(6, 'Enter a valid registration')
    .regex(/^[A-Z]{2}\s?\d{1,2}\s?[A-Z]{1,3}\s?\d{1,4}$/i, 'Format like RJ14 AB 4521'),
  ownerId: z.string().min(1, 'Select the vehicle owner'),
  type: z.enum(['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Two Wheeler']),
  brand: z.string().min(2, 'Enter the brand'),
  model: z.string().min(1, 'Enter the model'),
  color: z.string().min(2, 'Enter the colour'),
  year: z.coerce.number().min(1990, 'Year looks too old').max(new Date().getFullYear() + 1, 'Invalid year'),
  fuelType: z.enum(['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid']),
  lastService: z.string().optional(),
  nextService: z.string().optional(),
  notes: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof schema>;

const brands = [
  'Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota', 'Kia', 'Skoda',
  'Volkswagen', 'MG', 'Renault', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Other',
];
const colors = ['Pearl White', 'Polar White', 'Super White', 'Nexa Blue', 'Fiery Red', 'Calgary White', 'Oberon Black', 'Midnight Black', 'Gravity Grey', 'Silky Silver', 'Radiant Red', 'Imperial Blue'];

export function VehicleFormModal({
  open,
  onClose,
  vehicle,
  presetOwnerId,
}: {
  open: boolean;
  onClose: () => void;
  vehicle?: Vehicle | null;
  presetOwnerId?: string;
}) {
  const { vehicles, customers, dispatch } = useStore();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      registration: '',
      ownerId: '',
      type: 'SUV',
      brand: '',
      model: '',
      color: 'Pearl White',
      year: new Date().getFullYear(),
      fuelType: 'Petrol',
      lastService: '',
      nextService: '',
      notes: '',
    },
  });

  const selectedBrand = watch('brand');

  useEffect(() => {
    if (!open) return;
    reset(
      vehicle
        ? {
            registration: vehicle.registration,
            ownerId: vehicle.ownerId,
            type: vehicle.type,
            brand: vehicle.brand,
            model: vehicle.model,
            color: vehicle.color,
            year: vehicle.year,
            fuelType: vehicle.fuelType,
            lastService: vehicle.lastService || '',
            nextService: vehicle.nextService || '',
            notes: vehicle.notes || '',
          }
        : {
            registration: '',
            ownerId: presetOwnerId || '',
            type: 'SUV',
            brand: '',
            model: '',
            color: 'Pearl White',
            year: new Date().getFullYear(),
            fuelType: 'Petrol',
            lastService: '',
            nextService: '',
            notes: '',
          }
    );
  }, [open, vehicle, presetOwnerId, reset]);

  const onSubmit = (v: FormValues) => {
    const payload: Vehicle = {
      id: vehicle?.id || nextId('VEH', vehicles),
      registration: v.registration.toUpperCase().replace(/\s+/g, ' '),
      type: v.type as VehicleType,
      brand: v.brand,
      model: v.model,
      color: v.color,
      ownerId: v.ownerId,
      lastService: v.lastService || null,
      nextService: v.nextService || null,
      fuelType: v.fuelType,
      year: v.year,
      notes: v.notes || '',
    };
    dispatch(vehicle ? { type: 'UPDATE_VEHICLE', payload } : { type: 'ADD_VEHICLE', payload });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={vehicle ? `Edit ${vehicle.registration}` : 'Add vehicle'}
      description={vehicle ? 'Update vehicle details and service reminders.' : 'Register a customer vehicle to link future bookings.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" leftIcon={vehicle ? <Save className="h-3.5 w-3.5" /> : <Car className="h-3.5 w-3.5" />} onClick={handleSubmit(onSubmit)}>
            {vehicle ? 'Save changes' : 'Add vehicle'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Registration number" required error={errors.registration?.message} hint="e.g. RJ14 AB 4521">
            <Input {...register('registration')} placeholder="RJ14 AB 4521" className="uppercase" invalid={!!errors.registration} />
          </Field>
          <Field label="Owner" required error={errors.ownerId?.message}>
            <Select
              {...register('ownerId')}
              options={customers.map((c) => ({ value: c.id, label: `${c.name} · ${c.phone}` }))}
              placeholder="Select customer"
              invalid={!!errors.ownerId}
            />
          </Field>
          <Field label="Vehicle type" required>
            <Select {...register('type')} options={['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury', 'Two Wheeler'].map((t) => ({ value: t, label: t }))} />
          </Field>
          <Field label="Brand" required error={errors.brand?.message}>
            <Select {...register('brand')} options={brands.map((b) => ({ value: b, label: b }))} placeholder="Select brand" invalid={!!errors.brand} />
          </Field>
          <Field label="Model" required error={errors.model?.message}>
            <Input {...register('model')} placeholder={selectedBrand === 'Maruti Suzuki' ? 'e.g. Baleno' : 'e.g. Creta'} invalid={!!errors.model} />
          </Field>
          <Field label="Colour" required error={errors.color?.message}>
            <Select {...register('color')} options={colors.map((c) => ({ value: c, label: c }))} invalid={!!errors.color} />
          </Field>
          <Field label="Manufacturing year" required error={errors.year?.message}>
            <Input type="number" {...register('year')} invalid={!!errors.year} />
          </Field>
          <Field label="Fuel type" required>
            <Select {...register('fuelType')} options={['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'].map((f) => ({ value: f, label: f }))} />
          </Field>
          <Field label="Last service date" hint="Leave blank if never serviced">
            <Input type="date" {...register('lastService')} />
          </Field>
          <Field label="Next service reminder" hint="Typically 30 days after last service">
            <Input type="date" {...register('nextService')} />
          </Field>
        </div>
        <Field label="Vehicle notes" hint="Paint condition, restrictions, accessories">
          <Textarea {...register('notes')} rows={2} placeholder="e.g. Hand wash only — no automated brushes." />
        </Field>
      </form>
    </Modal>
  );
}
