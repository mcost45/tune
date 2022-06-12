import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { LoggedInActivateGuard } from './guards/logged-in-activate.guard';

const routes: Routes = [
	{
		path: '',
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
		loadChildren: () =>
			import('./components/auth-callback/auth-callback.module').then(
				(m) => m.AuthCallbackModule
			)
	},
	{
		path: 'feed',
		loadChildren: () =>
			import('./components/pages/feed/feed.module').then((m) => m.FeedPageModule),
		canActivate: [LoggedInActivateGuard],
		runGuardsAndResolvers: 'always'
	},
	{
		path: 'login-failed',
		loadChildren: () =>
			import('./components/pages/login-failed/login-failed.module').then(
				(m) => m.LoginFailedPageModule
			)
	},
	{
		path: '**',
		loadChildren: () =>
			import('./components/pages/not-found/not-found.module').then(
				(m) => m.NotFoundPageModule
			)
	}
];

@NgModule({
	imports: [
		RouterModule.forRoot(routes, {
			preloadingStrategy: PreloadAllModules,
			onSameUrlNavigation: 'reload'
		})
	],
	exports: [RouterModule]
})
export class AppRoutingModule {}
