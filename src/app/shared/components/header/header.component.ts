import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { filter, Observable } from 'rxjs';
import { UserService } from '../../../core/services/user.service';

@Component({
	selector: 'app-header',
	templateUrl: './header.component.html',
	styleUrls: ['./header.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {
	@Input() titleKey = '';

	user$: Observable<SpotifyApi.CurrentUsersProfileResponse | null>;
	imageUrl$: Observable<string | null>;

	constructor(private readonly userService: UserService) {
		this.user$ = userService.getUser$().pipe(filter((user) => !!user));
		this.imageUrl$ = userService.getImageUrl$();
	}
}
