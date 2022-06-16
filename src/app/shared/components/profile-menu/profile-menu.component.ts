import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LoginService } from '../../../core/services/login.service';

@Component({
	selector: 'app-profile-menu',
	templateUrl: './profile-menu.component.html',
	styleUrls: ['./profile-menu.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileMenuComponent {
	@Input() user?: SpotifyApi.CurrentUsersProfileResponse | null;

	constructor(private readonly loginService: LoginService) {}

	async onLogout(): Promise<void> {
		await this.loginService.logout();
	}
}
