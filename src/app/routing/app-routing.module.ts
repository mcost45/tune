import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes, TitleStrategy } from '@angular/router';
import { LoggedInActivateGuard } from './guards/logged-in-activate.guard';
import { AppTitleStrategy } from './app-title-strategy';

const routes: Routes = [
	{
		path: '',
		title: 'APP.SUBTITLES.HOME',
		loadChildren: () =>
			import('./components/pages/home/home.module').then((m) => m.HomePageModule)
	},
	{
		path: 'home',
		redirectTo: '',
		pathMatch: 'full'
	},
	{
		path: 'auth-callback',
		title: 'APP.SUBTITLES.AUTHORISATION',
		loadChildren: () =>
			import('./components/auth-callback/auth-callback.module').then(
				(m) => m.AuthCallbackModule
			)
	},
	{
		path: 'feed',
		title: 'APP.SUBTITLES.FEED',
		loadChildren: () =>
			import('./components/pages/feed/feed.module').then((m) => m.FeedPageModule),
		canActivate: [LoggedInActivateGuard]
	},
	{
		path: 'login-failed',
		title: 'APP.SUBTITLES.LOGIN_FAILED',
		loadChildren: () =>
			import('./components/pages/login-failed/login-failed.module').then(
				(m) => m.LoginFailedPageModule
			)
	},
	{
		path: '**',
		title: 'APP.SUBTITLES.PAGE_NOT_FOUND',
		loadChildren: () =>
			import('./components/pages/not-found/not-found.module').then(
				(m) => m.NotFoundPageModule
			)
	}
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {
			preloadingStrategy: PreloadAllModules
		})
	],
	exports: [RouterModule],
	providers: [
		{
			provide: TitleStrategy,
			useClass: AppTitleStrategy
		}
	]
})
export class AppRoutingModule {}
