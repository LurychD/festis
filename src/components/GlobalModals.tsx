import React from 'react';
import { AnimatePresence } from 'motion/react';
import { ReminderModal } from './ReminderModal';
import { FestivalModal } from './FestivalModal';
import { Festival, Reminder, Platform, DistributionPlan } from '../types';

interface GlobalModalsProps {
  isReminderModalOpen: boolean;
  setIsReminderModalOpen: (open: boolean) => void;
  editingReminder: Reminder | null;
  setEditingReminder: (rem: Reminder | null) => void;
  addReminder: (data: Omit<Reminder, 'id'>) => void;
  updateReminder: (id: string, data: Partial<Reminder>) => void;
  festivals: Festival[];
  selectedCalendarDate?: Date | null;
  userEmail?: string | null;

  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  modalType: 'create' | 'edit' | 'new_edition';
  selectedFestival: Festival | null;
  userName: string;
  isAuthorized: boolean;
  isDev?: boolean;
  setFestivals: React.Dispatch<React.SetStateAction<Festival[]>>;
  setSelectedFestival: (f: Festival | null) => void;
  addAuditLog: (section: string, action: string) => void;
  showAlert: (msg: string) => void;
  platforms: Platform[];
  distributionPlans?: DistributionPlan[];
}

/**
 * Contenedor modular de modales globales para mantener limpio el archivo principal App.tsx.
 */
export const GlobalModals: React.FC<GlobalModalsProps> = ({
  isReminderModalOpen,
  setIsReminderModalOpen,
  editingReminder,
  setEditingReminder,
  addReminder,
  updateReminder,
  festivals,
  selectedCalendarDate,
  userEmail,
  isModalOpen,
  setIsModalOpen,
  modalType,
  selectedFestival,
  userName,
  isAuthorized,
  isDev,
  setFestivals,
  setSelectedFestival,
  addAuditLog,
  showAlert,
  platforms,
  distributionPlans = [],
}) => {
  return (
    <AnimatePresence>
      <ReminderModal
        key="global-reminder-modal"
        isOpen={isReminderModalOpen}
        onClose={() => {
          setIsReminderModalOpen(false);
          setTimeout(() => setEditingReminder(null), 200);
        }}
        onSave={(data) => {
          if (editingReminder && editingReminder.id) {
            updateReminder(editingReminder.id, data);
          } else {
            addReminder({
              ...data,
              createdAt: new Date().toISOString(),
              createdBy: userEmail || 'desconocido',
            });
          }
        }}
        initialData={editingReminder}
        festivals={festivals}
        defaultDate={selectedCalendarDate}
      />

      <FestivalModal
        key="global-festival-modal"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modalType={modalType}
        selectedFestival={selectedFestival}
        userName={userName}
        isAuthorized={isAuthorized}
        isDev={isDev}
        festivals={festivals}
        setFestivals={setFestivals}
        setSelectedFestival={setSelectedFestival}
        addAuditLog={addAuditLog}
        showAlert={showAlert}
        platforms={platforms}
        distributionPlans={distributionPlans}
      />
    </AnimatePresence>
  );
};
