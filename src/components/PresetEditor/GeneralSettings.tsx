
import React from 'react';
import type { SillyTavernPreset } from '../../types';
import { Section } from '../ui/Section';
import { LabeledInput } from '../ui/LabeledInput';
import { LabeledTextarea } from '../ui/LabeledTextarea';

interface GeneralSettingsProps {
    preset: SillyTavernPreset;
    onChange: (field: keyof SillyTavernPreset, value: any) => void;
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ preset, onChange }) => (
    <Section title="Thông tin cơ bản" description="Tên, nhận xét và lời nhắc hệ thống chung.">
        <LabeledInput label="Tên Preset" value={preset.name || ''} onChange={(e) => onChange('name', e.target.value)} />
        <LabeledInput label="Nhận xét" value={preset.comment || ''} onChange={(e) => onChange('comment', e.target.value)} />
        <LabeledTextarea label="Lời nhắc Hệ thống" value={preset.system_prompt || ''} onChange={(e) => onChange('system_prompt', e.target.value)} rows={6} containerClassName="md:col-span-2" />
    </Section>
);
