import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Injectable({
	providedIn: 'root'
})
export class HapticService {
	onLightImpact(): Promise<void> {
		return Haptics.impact({ style: ImpactStyle.Light });
	}

	onMediumImpact(): Promise<void> {
		return Haptics.impact({ style: ImpactStyle.Medium });
	}

	onHeavyImpact(): Promise<void> {
		return Haptics.impact({ style: ImpactStyle.Heavy });
	}

	onSelectionStart(): Promise<void> {
		return Haptics.selectionStart();
	}

	onSelectionEnd(): Promise<void> {
		return Haptics.selectionEnd();
	}
}
