import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { LoginService } from '../../../core/services/login.service';

@Component({
	selector: 'app-profile-button',
	templateUrl: './profile-button.component.html',
	styleUrls: ['./profile-button.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileButtonComponent {
	@Input() user$?: Observable<SpotifyApi.CurrentUsersProfileResponse | null>;
	@Input() imageUrl$?: Observable<string>;

	menuOpen = false;

	constructor(private readonly loginService: LoginService) {}

	toggleMenu(): void {
		this.menuOpen = !this.menuOpen;
	}

	onDismissMenu(): void {
		this.menuOpen = false;
	}

	onOpenMenu(): void {
		this.menuOpen = true;
	}

	async onLogin(): Promise<void> {
		await this.loginService.initLogin();
	}
}
